import { draft, finances, freeAgents, league, player, season, team } from "..";
import { isSport, PHASE, PLAYER } from "../../../common";
import type {
	Conditions,
	Conf,
	Div,
	GameAttributesLeague,
	GameAttributesLeagueWithHistory,
	GetLeagueOptions,
	League,
	PlayerWithoutKey,
	Team,
	TeamBasic,
	TeamSeasonWithoutKey,
	TeamStatsWithoutKey,
} from "../../../common/types";
import type { NewLeagueTeam } from "../../../ui/views/NewLeague/types";
import { CUMULATIVE_OBJECTS, parseJSON } from "../../api/leagueFileUpload";
import { Cache, connectLeague, idb } from "../../db";
import {
	helpers,
	local,
	lock,
	logEvent,
	random,
	toUI,
	updatePhase,
	updateStatus,
} from "../../util";
import g, { wrap } from "../../util/g";
import type { Settings } from "../../views/settings";
import { getAutoTicketPriceByTid } from "../game/attendance";
import addDraftProspects from "./create/addDraftProspects";
import createRandomPlayers from "./create/createRandomPlayers";
import createGameAttributes from "./createGameAttributes";
import initRepeatSeason from "./initRepeatSeason";
import remove from "./remove";

export type TeamInfo = TeamBasic & {
	disabled?: boolean;
	stadiumCapacity?: number;
	seasons?: TeamSeasonWithoutKey[];
	stats?: TeamStatsWithoutKey[];
};

const addDummyLeague = async ({
	lid,
	name,
	teams,
	tid,
}: {
	lid: number;
	name: string;
	teams: Team[];
	tid: number;
}) => {
	// These values will be updated later. We just want to make sure there's something in the meta database first, so the league can be deleted from the normal UI if something goes wrong.
	const dummyLeague: League = {
		lid,
		name,
		tid,
		phaseText: "",
		teamName: teams[tid].name,
		teamRegion: teams[tid].region,
		heartbeatID: undefined,
		heartbeatTimestamp: undefined,
		difficulty: g.get("difficulty"),
		created: new Date(),
		lastPlayed: new Date(),
		startingSeason: g.get("startingSeason"),
		season: g.get("season"),
		imgURL: teams[tid].imgURLSmall ?? teams[tid].imgURL,
	};

	// In case there was an old league with this lid, somehow
	const oldLeague = await idb.meta.get("leagues", lid);
	await remove(lid);
	if (oldLeague) {
		dummyLeague.created = oldLeague.created;
		dummyLeague.starred = oldLeague.starred;
	}

	await idb.meta.add("leagues", dummyLeague);

	idb.league = await connectLeague(lid);
};

class Buffer {
	MAX_BUFFER_SIZE: number;
	keptKeys: Set<string>;
	keys: Set<string>;
	rows: [string, any][];

	constructor(keptKeys: Set<string>) {
		this.MAX_BUFFER_SIZE = 1000;
		this.keptKeys = keptKeys;

		this.keys = new Set();
		this.rows = [];
	}

	addRows(rows: [string, any][]) {
		for (const row of rows) {
			const key = row[0];

			if (!this.keptKeys.has(key)) {
				return;
			}

			this.keys.add(key);
			this.rows.push(row);
		}
	}

	private clear() {
		this.keys = new Set();
		this.rows = [];
	}

	isFull() {
		return this.rows.length >= this.MAX_BUFFER_SIZE;
	}

	async flush() {
		const transaction = idb.league.transaction(
			Array.from(this.keys) as any,
			"readwrite",
		);

		for (const row of this.rows) {
			transaction.objectStore(row[0]).put(row[1]);
		}

		await transaction.done;

		this.clear();
	}
}

type PreProcessParams = {
	activeTids: number[];
	averagePopulation: number | undefined;
	hasRookieContracts: boolean | undefined;
	noStartingInjuries: boolean;
	scoutingRank: number;
	version: number | undefined;
};

const preProcess = async (
	key: string,
	x: any,
	{
		activeTids,
		averagePopulation,
		hasRookieContracts,
		noStartingInjuries,
		scoutingRank,
		version,
	}: PreProcessParams,
) => {
	if (key === "draftPicks") {
		if (typeof x.pick !== "number") {
			x.pick = 0;
		}
	} else if (key === "games") {
		// Fix missing +/-, blocks against in boxscore
		if (!x.teams[0].hasOwnProperty("ba")) {
			x.teams[0].ba = 0;
			x.teams[1].ba = 0;
		}
		for (const t of x.teams) {
			for (const p of t.players) {
				if (!p.hasOwnProperty("ba")) {
					p.ba = 0;
				}
				if (!p.hasOwnProperty("pm")) {
					p.pm = 0;
				}
			}
		}
	} else if (key === "players") {
		const p: PlayerWithoutKey = await player.augmentPartialPlayer(
			{ ...x },
			scoutingRank,
			version,
			true,
		);
		if (!x.contract) {
			p.contract.temp = true;
			if (!x.salaries) {
				p.salaries = [];
			}
		}

		// Impute rookie contract status if there is no contract for this player, or if the entire league file has no rookie contracts
		if (
			p.tid >= 0 &&
			!g.get("hardCap") &&
			(!x.contract || !hasRookieContracts)
		) {
			const rookieContractLength = draft.getRookieContractLength(p.draft.round);
			const rookieContractExp = p.draft.year + rookieContractLength;

			if (rookieContractExp >= g.get("season")) {
				(p as any).rookieContract = true;
			}
		}

		if (p.tid >= 0 && !activeTids.includes(p.tid)) {
			p.tid = PLAYER.FREE_AGENT;
		}

		if (noStartingInjuries && x.injury) {
			p.injury = {
				type: "Healthy",
				gamesRemaining: 0,
			};
		}

		x = p;
	} else if (key === "scheduledEvents" && averagePopulation !== undefined) {
		if (x.type === "expansionDraft") {
			for (const t of x.info.teams) {
				t.pop = averagePopulation;
			}
		} else if (x.type === "teamInfo" && x.info.pop !== undefined) {
			x.info.pop = averagePopulation;
		}
	}

	return x;
};

const getSaveToDB = async ({
	keys,
	maxGid,
	preProcessParams,
}: {
	keys: Set<string>;
	maxGid: number | undefined;
	preProcessParams: PreProcessParams;
}) => {
	const buffer = new Buffer(keys);

	const extraFromStream: {
		activePlayers: PlayerWithoutKey[];
		hasEvents;
	} = {
		activePlayers: [],
		hasEvents: false,
	};

	let currentScheduleGid = maxGid ?? -1;

	const writableStream = new WritableStream<{
		key: string;
		value: any;
	}>({
		async write(chunk, controller) {
			const { key, value } = chunk;

			if (CUMULATIVE_OBJECTS.has(key) || key === "teams") {
				// Currently skipped:
				// - meta because it doesn't get written to DB
				// - gameAttributes/startingSeason/version/teams because we already have it from basicInfo.
				return;
			}

			// Overwrite schedule with known safe gid (higher than any game) in case it is somehow conflicting with games, because schedule gids are not referenced anywhere else but game gids are
			if (key === "schedule") {
				currentScheduleGid += 1;
				value.gid = currentScheduleGid;
			}

			if (key === "events") {
				extraFromStream.hasEvents = true;
			}

			const processed = await preProcess(key, value, preProcessParams);

			if (
				key === "players" &&
				(processed.tid >= PLAYER.UNDRAFTED ||
					processed.tid === PLAYER.UNDRAFTED_FANTASY_TEMP)
			) {
				extraFromStream.activePlayers.push(processed);
			} else {
				buffer.addRows([key, processed]);
				if (buffer.isFull()) {
					await buffer.flush();
				}
			}
		},

		async close() {
			await buffer.flush();
		},
	});

	return {
		extraFromStream,
		saveToDB: writableStream,
	};
};

const finalizeStartingSeason = (
	startingSeasonFromFile: number | undefined,
	startingSeasonFromInput: string | undefined,
) => {
	if (startingSeasonFromFile !== undefined) {
		return startingSeasonFromFile;
	}

	if (startingSeasonFromInput) {
		const startingSeason2 = parseInt(startingSeasonFromInput);
		if (!Number.isNaN(startingSeason2)) {
			return startingSeason2;
		}
	}

	return new Date().getFullYear();
};

type GameAttributeOverrides = Partial<Record<keyof GameAttributesLeague, any>>;

const finalizeGameAttributes = async ({
	conditions,
	gameAttributes,
	gameAttributeOverrides,
	getLeagueOptions,
	randomization,
	startingSeason,
	teamInfos,
	tid,
	version,
}: {
	conditions?: Conditions;
	gameAttributes: any;
	gameAttributeOverrides: GameAttributeOverrides;
	getLeagueOptions: GetLeagueOptions | undefined;
	randomization: "none" | "shuffle" | "debuts" | "debutsForever";
	startingSeason: number;
	teamInfos: TeamInfo[];
	tid: number;
	version: number | undefined;
}) => {
	const finalized = {
		...gameAttributes,
	};

	for (const key of helpers.keys(gameAttributeOverrides)) {
		// If we're overriding a value with history, keep the history
		finalized[key] = wrap(finalized, key, gameAttributeOverrides[key], {
			season: finalized.season ?? startingSeason,
			phase: finalized.phase ?? PHASE.PRESEASON,
		});
	}

	if (
		randomization === "debutsForever" &&
		finalized.randomDebutsForever === undefined
	) {
		finalized.randomDebutsForever = 1;
	}

	if (
		getLeagueOptions?.type === "real" &&
		getLeagueOptions?.realStats === "all"
	) {
		let start = finalized.season;
		if (getLeagueOptions.phase > PHASE.PLAYOFFS) {
			start += 1;
		}

		// startingSeason is 1947, so use userTid history to denote when user actually started managing team
		finalized.userTid = [
			{ start: -Infinity, value: PLAYER.DOES_NOT_EXIST },
			{
				start,
				value: tid,
			},
		];
	}

	// Also mutates teamInfos
	const finalized2 = await createGameAttributes(
		{
			gameAttributesInput: finalized,
			startingSeason,
			teamInfos,
			userTid: tid,
			version,
		},
		conditions,
	);

	return finalized2;
};

const finalizeDBExceptPlayers = async ({
	gameAttributes,
	teamSeasons,
	teamStats,
	teams,
}: {
	gameAttributes: GameAttributesLeagueWithHistory;
	teamSeasons: TeamSeasonWithoutKey[];
	teamStats: TeamStatsWithoutKey[];
	teams: Team[];
}) => {
	const tx = idb.league.transaction(
		[
			"games",
			"gameAttributes",
			"schedule",
			"teamSeasons",
			"teamStats",
			"teams",
			"trade",
		],
		"readwrite",
	);

	const tradeStore = tx.objectStore("trade");
	const trade = await tradeStore.get(0);
	if (!trade) {
		const tid = g.get("userTid");
		await tradeStore.add({
			rid: 0,
			teams: [
				{
					tid,
					pids: [],
					pidsExcluded: [],
					dpids: [],
					dpidsExcluded: [],
				},
				{
					// Load initial trade view with the lowest-numbered non-user team (so, either 0 or 1).
					tid: tid === 0 ? 1 : 0,
					pids: [],
					pidsExcluded: [],
					dpids: [],
					dpidsExcluded: [],
				},
			],
		});
	}

	// Set numDraftPicksCurrent
	if (gameAttributes.phase === PHASE.DRAFT && leagueFile.draftPicks) {
		const currentDraftPicks = leagueFile.draftPicks.filter(
			dp => dp.season === gameAttributes.season,
		);
		const draftNotStarted =
			currentDraftPicks.every(dp => dp.round === 0) ||
			currentDraftPicks.some(dp => dp.round === 1 && dp.pick === 1);
		if (draftNotStarted) {
			const numDraftPicksCurrent = currentDraftPicks.length;
			if (numDraftPicksCurrent > 0) {
				gameAttributes.numDraftPicksCurrent = numDraftPicksCurrent;
			}
		}
	}

	// Handle schedule with no "day" property
	const scheduleStore = tx.objectStore("schedule");
	const schedule = await scheduleStore.getAll();
	if (schedule.length > 0) {
		const missingDay = schedule.some(
			matchup => typeof matchup.day !== "number",
		);

		if (missingDay) {
			const gamesThisSeason = await tx
				.objectStore("games")
				.index("season")
				.getAll(g.get("season"));

			const updatedSchedule = season.addDaysToSchedule(
				schedule,
				gamesThisSeason,
			);

			for (const game of updatedSchedule) {
				await scheduleStore.put(game as any);
			}
		}
	}

	const teamsStore = tx.objectStore("teams");
	for (const t of teams) {
		await teamsStore.put(t);
	}

	const teamSeasonsStore = tx.objectStore("teamSeasons");
	for (const ts of teamSeasons) {
		await teamSeasonsStore.put(ts as any);
	}

	const teamStatsStore = tx.objectStore("teamStats");
	for (const ts of teamStats) {
		await teamStatsStore.put(ts);
	}

	const gameAttributesStore = tx.objectStore("gameAttributes");
	for (const [key, value] of Object.entries(gameAttributes)) {
		await gameAttributesStore.put({ key: key as any, value });
	}
};

const confirmSequential = (objs: any, key: string, objectName: string) => {
	const values = new Set();

	for (const obj of objs) {
		const value = obj[key];

		if (typeof value !== "number") {
			throw new Error(`Missing or invalid ${key} for ${objectName}`);
		}

		values.add(value);
	}

	for (let i = 0; i < values.size; i++) {
		if (!values.has(i)) {
			throw new Error(
				`${key} values must be sequential with no gaps starting from 0, but no ${objectName} has a value of ${i}`,
			);
		}
	}

	return values;
};

const processTeamInfos = (teamInfos: any[], userTid: number) => {
	const teams = teamInfos.map(t => team.generate(t));

	const teamSeasons: TeamSeasonWithoutKey[] = [];
	const teamStats: TeamStatsWithoutKey[] = [];

	let scoutingRank: number | undefined;

	for (let i = 0; i < teams.length; i++) {
		const t = teams[i];
		const teamInfo = teamInfos[i];
		let teamSeasonsLocal: TeamSeasonWithoutKey[];

		if (teamInfo.seasons) {
			teamSeasonsLocal = teamInfo.seasons;
			const last = teamSeasonsLocal.at(-1);

			if (last.season !== g.get("season") && !t.disabled) {
				last.season = g.get("season");

				// Remove any past seasons that claim to be from this season or a future season
				teamSeasonsLocal = [
					...teamSeasonsLocal.filter(ts => ts.season < last.season),
					last,
				];
			}

			for (const teamSeason of teamSeasonsLocal) {
				// See similar code in teamsPlus
				const copyFromTeamIfUndefined = [
					"cid",
					"did",
					"region",
					"name",
					"abbrev",
					"imgURL",
					"colors",
					"jersey",
				] as const;
				for (const key of copyFromTeamIfUndefined) {
					if (
						teamSeason[key] === undefined ||
						(teamSeason.season === g.get("season") &&
							g.get("phase") < PHASE.PLAYOFFS)
					) {
						// @ts-ignore
						teamSeason[key] = t[key];
					}
				}

				if (teamSeason.numPlayersTradedAway === undefined) {
					teamSeason.numPlayersTradedAway = 0;
				}
			}
		} else if (!t.disabled) {
			teamSeasonsLocal = [team.genSeasonRow(t)];
			teamSeasonsLocal[0].pop = teamInfo.pop;
			// @ts-ignore
			teamSeasonsLocal[0].stadiumCapacity = teamInfo.stadiumCapacity;
		} else {
			teamSeasonsLocal = [];
		}

		for (const teamSeason of teamSeasonsLocal) {
			teamSeason.tid = t.tid;

			if (typeof teamSeason.stadiumCapacity !== "number") {
				teamSeason.stadiumCapacity =
					t.stadiumCapacity !== undefined
						? t.stadiumCapacity
						: g.get("defaultStadiumCapacity");
			}

			// If this is specified in a league file, we can ignore it because they should all be in order, and sometimes people manually edit the file and include duplicates
			delete teamSeason.rid;

			// teamSeasons = teamSeasons.filter(ts2 => ts2.season !== teamSeason.season);
			teamSeasons.push(teamSeason);
		}

		const teamStatsLocal: TeamStatsWithoutKey[] = teamInfo.stats ?? [];

		for (const ts of teamStatsLocal) {
			ts.tid = t.tid;

			if (ts.hasOwnProperty("ba")) {
				ts.oppBlk = ts.ba;
				delete ts.ba;
			}

			if (typeof ts.oppBlk !== "number" || Number.isNaN(ts.oppBlk)) {
				ts.oppBlk = 0;
			}

			// teamStats = teamStats.filter(ts2 => ts2.season !== ts.season);
			teamStats.push(ts);
		}

		// Save scoutingRank for later
		if (i === userTid) {
			scoutingRank = finances.getRankLastThree(
				teamSeasonsLocal,
				"expenses",
				"scouting",
			);
		}
	}

	if (scoutingRank === undefined) {
		throw new Error("scoutingRank should be defined");
	}

	return {
		scoutingRank,
		teams,
		teamSeasons,
		teamStats,
	};
};

const finalizeActivePlayers = async ({
	activeTids,
	fileHasPlayers,
	playersInput,
}: {
	activeTids: number[];
	fileHasPlayers: boolean;
	playersInput: PlayerWithoutKey[];
}) => {
	// If no players were uploaded in custom league file, add some relatives!
	if (!fileHasPlayers) {
		const players0 = await idb.cache.players.getAll();
		for (const p of players0) {
			await player.addRelatives(p);
		}
	}

	// A new loop, because addRelatives updates the database
	const players1 = await idb.cache.players.getAll();
	for (const p of players1) {
		if (fileHasPlayers) {
			// Fix jersey numbers, which matters for league files where that data might be invalid (conflicts) or incomplete
			if (p.tid >= 0 && p.stats.length > 0 && !p.stats.at(-1).jerseyNumber) {
				p.stats.at(-1).jerseyNumber = await player.genJerseyNumber(p);
			}
		}

		await player.updateValues(p);
		await idb.cache.players.put(p);
	}

	const pidsToNormalize = players1.filter(p => p.contract.temp).map(p => p.pid);
	await freeAgents.normalizeContractDemands({
		type: "newLeague",
		pids: pidsToNormalize,
	});

	// WHY IS THIS NEEDED? Can't use players0 because the addRelatives call above might make a copy of a player object and write it to the cache, in which case the prior objects for those players in players0 will be stale.
	const players = await idb.cache.players.getAll();

	// Adjustment for hard cap - lower contracts for teams above cap
	if (!fileHasPlayers && g.get("hardCap")) {
		const teams = await idb.cache.teams.getAll();
		for (const t of teams) {
			if (t.disabled) {
				continue;
			}
			const roster = players.filter(p => p.tid === t.tid);
			let payroll = roster.reduce((total, p) => total + p.contract.amount, 0);

			while (payroll > g.get("salaryCap")) {
				let foundAny = false;

				for (const p of roster) {
					if (p.contract.amount >= g.get("minContract") + 50) {
						p.contract.amount -= 50;
						payroll -= 50;
						foundAny = true;
					}
				}

				if (!foundAny) {
					throw new Error(
						"Invalid combination of hardCap, salaryCap, and minContract",
					);
				}
			}
		}
	}

	for (const p of players) {
		if (p.tid >= 0 && p.salaries.length === 0) {
			player.setContract(p, p.contract, true);
		}

		if ((p as any).rookieContract) {
			p.contract.rookie = true;
			delete (p as any).rookieContract;
		}

		delete p.contract.temp;

		// Maybe not needed, but let's be sure
		await idb.cache.players.put(p);
	}
};

const createStream = async (
	stream: ReadableStream,
	{
		conditions,
		confs,
		divs,
		fromFile,
		getLeagueOptions,
		keys,
		lid,
		name,
		settings,
		shuffleRosters,
		startingSeasonFromInput,
		teamsFromInput, // use if none in file
		tid,
	}: {
		conditions?: Conditions;
		confs: Conf[];
		divs: Div[];
		fromFile: {
			gameAttributes: Record<string, unknown> | undefined;
			hasRookieContracts: boolean | undefined;
			maxGid: number | undefined;
			startingSeason: number | undefined;
			teams: any[] | undefined;
			version: number | undefined;
		};
		getLeagueOptions: GetLeagueOptions | undefined;
		keys: Set<string>;
		lid: number;
		name: string;
		settings: Omit<Settings, "numActiveTeams">;
		shuffleRosters: boolean;
		startingSeasonFromInput: string | undefined;
		teamsFromInput: NewLeagueTeam[];
		tid: number;
	},
) => {
	// These wouldn't be needed here, except the beforeView logic is fucked up
	lock.reset();
	local.reset();

	// Single out all the weird settings that don't go directly into gameAttributes
	const {
		noStartingInjuries,
		randomization,
		repeatSeason,

		// realStats is already in getLeagueOptions
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		realStats,

		...otherSettings
	} = settings;

	const gameAttributeOverrides: GameAttributeOverrides = {
		...otherSettings,
		confs,
		divs,
	};

	// This setting is allowed to be undefined, so make it that way when appropriate
	if (!getLeagueOptions || getLeagueOptions.type !== "real") {
		delete gameAttributeOverrides.realDraftRatings;
	}

	const startingSeason = finalizeStartingSeason(
		fromFile.startingSeason,
		startingSeasonFromInput,
	);

	const teamInfos = helpers.addPopRank(fromFile.teams ?? teamsFromInput);

	// Validation of some identifiers
	confirmSequential(teamInfos, "tid", "team");

	const gameAttributes = await finalizeGameAttributes({
		conditions,
		// Use fromFile.gameAttributes in addition to gameAttributeOverrides because it preserves history and any non-standard settings
		gameAttributes: fromFile.gameAttributes ?? {},
		gameAttributeOverrides,
		getLeagueOptions,
		randomization,
		startingSeason,
		teamInfos,
		tid,
		version: fromFile.version,
	});

	let averagePopulation: number | undefined;
	if (gameAttributes.equalizeRegions) {
		let totalPopulation = 0;
		for (const t of teamInfos) {
			totalPopulation += t.pop;
		}

		// Round to 2 digits
		averagePopulation =
			Math.round((totalPopulation / teamInfos.length) * 100) / 100;

		for (const t of teamInfos) {
			t.pop = averagePopulation;
		}
	}

	// Hacky - put gameAttributes in g so they can be seen by functions called from this function
	helpers.resetG();
	Object.assign(g, gameAttributes);

	// Needs to be done after g is set
	const { scoutingRank, teams, teamSeasons, teamStats } = processTeamInfos(
		teamInfos,
		tid,
	);

	const activeTids = teams.filter(t => !t.disabled).map(t => t.tid);

	await addDummyLeague({
		lid,
		name,
		teams,
		tid,
	});

	const { extraFromStream, saveToDB } = await getSaveToDB({
		keys,
		maxGid: fromFile.maxGid,
		preProcessParams: {
			activeTids,
			averagePopulation,
			hasRookieContracts: fromFile.hasRookieContracts,
			noStartingInjuries,
			scoutingRank,
			version: fromFile.version,
		},
	});

	await stream.pipeThrough(parseJSON()).pipeTo(saveToDB);

	if (shuffleRosters) {
		// Assign the team ID of all players to the 'playerTids' array.
		// Check tid to prevent draft prospects from being swapped with established players
		const numPlayersToShuffle = extraFromStream.activePlayers.filter(
			p => p.tid > PLAYER.FREE_AGENT,
		).length;

		const playerTids = [];
		while (playerTids.length < numPlayersToShuffle) {
			// Shuffle each set of tids individually, because if we did all at once, rosters might wind up unbalanced
			const shuffled = [...activeTids];
			random.shuffle(shuffled);
			playerTids.push(...shuffled);
		}

		for (const p of extraFromStream.activePlayers) {
			p.transactions = [];

			if (p.tid > PLAYER.FREE_AGENT) {
				p.tid = playerTids.pop()!;

				if (p.stats && p.stats.length > 0) {
					p.stats.at(-1).tid = p.tid;

					if (p.statsTids) {
						p.statsTids.push(p.tid);
					} else {
						p.statsTids = [p.tid];
					}
				}
			}
		}
	}

	const fileHasPlayers = extraFromStream.activePlayers.length > 0;
	const activePlayers = fileHasPlayers
		? extraFromStream.activePlayers
		: await createRandomPlayers({
				activeTids,
				scoutingRank,
				teams,
		  });

	await addDraftProspects({
		players: activePlayers,
		scoutingRank,
	});

	// Unless we got strategy from a league file, calculate it here
	for (let i = 0; i < teams.length; i++) {
		if (teamInfos[i].strategy === undefined) {
			const teamPlayers = activePlayers
				.filter(p => p.tid === i)
				.map(p => ({
					value: p.value,
					ratings: p.ratings.at(-1),
				}));
			const ovr = team.ovr(teamPlayers);
			teams[i].strategy = ovr >= 60 ? "contending" : "rebuilding";
		}
	}

	// Write final versions of everything to the DB, except active players because some post-processing uses functions that read from the cache
	await finalizeDBExceptPlayers({
		gameAttributes,
		teamSeasons,
		teamStats,
		teams,
	});

	// Clear old game attributes from g, to make sure the new ones are saved to the db in setGameAttributes
	helpers.resetG();
	g.setWithoutSavingToDB("lid", lid);
	gameAttributes.lid = lid;
	await toUI("resetLeague", []);

	if (idb.cache) {
		idb.cache.stopAutoFlush();
	}

	idb.cache = new Cache();
	idb.cache.newLeague = true;
	await idb.cache.fill(gameAttributes.season);

	// Hack! Need to not include lid in the update here, because then it gets sent to the UI and is seen in Controller before the URL changes, which interferes with running beforeLeague when the first view in the new league is loaded. lol
	const gameAttributesToUpdate: Partial<GameAttributesLeague> = {
		...gameAttributes,
	};
	delete gameAttributesToUpdate.lid;

	// Handle gameAttributes special, to get extra functionality from setGameAttributes and because it's not in the database native format in leagueData (object, not array like others).
	await league.setGameAttributes(gameAttributesToUpdate);

	for (const p of activePlayers) {
		await idb.cache.players.put(p);
	}
	await finalizeActivePlayers({
		activeTids,
		fileHasPlayers,
		playersInput: activePlayers,
	});

	// Handle repeatSeason after creating league, so we know what random players were created
	if (repeatSeason && g.get("repeatSeason") === undefined) {
		await initRepeatSeason();
	}

	const skipNewPhase = fromFile.gameAttributes?.phase !== undefined;
	const realPlayers = !!getLeagueOptions;

	if (!skipNewPhase || realPlayers) {
		await updatePhase();
		await updateStatus("Idle");

		// Auto sort rosters
		for (const t of teams) {
			let noRosterOrderSet = true;
			if (isSport("basketball") && fileHasPlayers) {
				for (const p of activePlayers) {
					if (p.tid === t.tid && typeof p.rosterOrder === "number") {
						noRosterOrderSet = false;
						break;
					}
				}
			}

			// If league file has players, don't auto sort even if skipNewPhase is false
			if (noRosterOrderSet || !g.get("userTids").includes(t.tid)) {
				await team.rosterAutoSort(t.tid);
			}
		}
	}

	if (g.get("phase") === PHASE.PLAYOFFS) {
		await season.newSchedulePlayoffsDay();
	}

	await draft.genPicks({
		realPlayers,
	});

	if (!extraFromStream.hasEvents) {
		await logEvent({
			text: "Welcome to your new league!",
			type: "newLeague",
			tids: [g.get("userTid")],
			showNotification: false,
			score: 20,
		});
	}

	{
		const teams = await idb.cache.teams.getAll();
		for (const t of teams) {
			if (!t.disabled && t.autoTicketPrice !== false) {
				t.budget.ticketPrice.amount = await getAutoTicketPriceByTid(t.tid);
			}
		}
	}
	await finances.updateRanks(["budget"]);

	await idb.cache.flush();
	idb.cache.startAutoFlush();
	local.leagueLoaded = true;
	return lid;
};

export default createStream;
