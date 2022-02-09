import type { IDBPTransaction } from "idb";
import { draft, finances, freeAgents, league, player, season, team } from "..";
import { applyRealTeamInfo, isSport, PHASE, PLAYER } from "../../../common";
import type {
	Conditions,
	Conf,
	Div,
	GameAttributesLeague,
	GameAttributesLeagueWithHistory,
	GetLeagueOptions,
	League,
	PlayerWithoutKey,
	RealPlayerPhotos,
	RealTeamInfo,
	Team,
	TeamBasic,
	TeamSeasonWithoutKey,
	TeamStatsWithoutKey,
} from "../../../common/types";
import type { NewLeagueTeam } from "../../../ui/views/NewLeague/types";
import { CUMULATIVE_OBJECTS } from "../../api/leagueFileUpload";
import { Cache, connectLeague, idb } from "../../db";
import {
	helpers,
	local,
	lock,
	logEvent,
	newLeagueGodModeLimits,
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
import getRealTeamPlayerData from "./create/getRealTeamPlayerData";
import createGameAttributes from "./createGameAttributes";
import initRepeatSeason from "./initRepeatSeason";
import remove from "./remove";

export type TeamInfo = TeamBasic & {
	disabled?: boolean;
	stadiumCapacity?: number;
	seasons?: TeamSeasonWithoutKey[];
	stats?: TeamStatsWithoutKey[];
};

// Doesn't seem to make a difference no matter what this is, but keeping at 1 makes the progress bar nicer
export const highWaterMark = 1;

const addLeagueMeta = async ({
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
	const l: League = {
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

	// In case we are importing over an old league
	const oldLeague = await idb.meta.get("leagues", lid);
	await remove(lid);
	if (oldLeague) {
		l.created = oldLeague.created;
		l.starred = oldLeague.starred;
	}

	await idb.meta.add("leagues", l);

	idb.league = await connectLeague(lid);
};

class Buffer {
	MAX_BUFFER_SIZE: number;
	keptKeys: Set<string>;
	keys: Set<string>;
	rows: [string, any][];
	previousTransaction: IDBPTransaction<any, any, any> | undefined;

	constructor(keptKeys: Set<string>) {
		this.MAX_BUFFER_SIZE = 10000;
		this.keptKeys = keptKeys;

		this.keys = new Set();
		this.rows = [];
	}

	addRow(row: [string, any]) {
		const key = row[0];

		if (!this.keptKeys.has(key)) {
			return;
		}

		this.keys.add(key);
		this.rows.push(row);
	}

	private clear() {
		this.keys = new Set();
		this.rows = [];
	}

	isFull() {
		return this.rows.length >= this.MAX_BUFFER_SIZE;
	}

	// This is so flush does not have to wait for the writes to complete before we start filling the buffer again
	async waitForPreviousTransaction() {
		if (this.previousTransaction) {
			await this.previousTransaction.done;
		}
	}

	async flush() {
		await this.waitForPreviousTransaction();

		if (this.keys.size > 0) {
			const transaction = idb.league.transaction(
				Array.from(this.keys) as any,
				"readwrite",
			);

			for (const row of this.rows) {
				transaction.objectStore(row[0]).put(row[1]);
			}

			this.previousTransaction = transaction;

			this.clear();
		}
	}

	async finalize() {
		await this.flush();
		await this.waitForPreviousTransaction();
	}
}

type PreProcessParams = {
	activeTids: number[];
	averagePopulation: number | undefined;
	hasRookieContracts: boolean | undefined;
	noStartingInjuries: boolean;
	realPlayerPhotos: RealPlayerPhotos | undefined;
	realTeamInfo: RealTeamInfo | undefined;
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
		realPlayerPhotos,
		realTeamInfo,
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
		if (realPlayerPhotos) {
			// Do this before augment so it doesn't need to create a face
			if (x.srID) {
				if (realPlayerPhotos[x.srID]) {
					x.imgURL = realPlayerPhotos[x.srID];
				} else {
					const name = x.name ?? `${x.firstName} ${x.lastName}`;

					// Keep in sync with bbgm-rosters
					const key = `dp_${x.draft.year}_${name
						.replace(/ /g, "_")
						.toLowerCase()}`;
					x.imgURL = realPlayerPhotos[key];
				}
			}
		}

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

		// Impute rookie contract status if there is no contract for this player, or if the entire league file has no rookie contracts. Don't check draftPickAutoContract here because we want all rookie contracts to be labeled as such, not just rookie scale contracts.
		if (p.tid >= 0 && (!x.contract || !hasRookieContracts)) {
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
	} else if (key === "scheduledEvents") {
		if (averagePopulation !== undefined) {
			if (x.type === "expansionDraft") {
				for (const t of x.info.teams) {
					t.pop = averagePopulation;
				}
			} else if (x.type === "teamInfo" && x.info.pop !== undefined) {
				x.info.pop = averagePopulation;
			}
		}

		// This is not really needed, since applyRealTeamInfo is called again in processScheduledEvents. It's just to make it look more normal in the database, for when I eventually build a GUI editor for scheduled events.
		if (realTeamInfo) {
			if (x.type === "expansionDraft") {
				for (const t of x.info.teams) {
					applyRealTeamInfo(t, realTeamInfo, x.season);
				}
			} else if (x.type === "teamInfo") {
				applyRealTeamInfo(x.info, realTeamInfo, x.season);
			}
		}
	}

	return x;
};

type ExtraFromStream = {
	activePlayers: PlayerWithoutKey[];
	hasEvents: boolean;
	teamHasRosterOrder: Set<number>;
};

const getSaveToDB = async ({
	keptKeys,
	maxGid,
	preProcessParams,
	setLeagueCreationStatus,
}: {
	keptKeys: Set<string>;
	maxGid: number | undefined;
	preProcessParams: PreProcessParams;
	setLeagueCreationStatus: CreateStreamProps["setLeagueCreationStatus"];
}) => {
	const buffer = new Buffer(keptKeys);

	const extraFromStream: ExtraFromStream = {
		activePlayers: [],
		hasEvents: false,
		teamHasRosterOrder: new Set(),
	};

	let currentScheduleGid = maxGid ?? -1;

	let prevKey: string | undefined;

	let currentPid = -1;

	const writableStream = new WritableStream<{
		key: string;
		value: any;
	}>(
		{
			async write(chunk) {
				const { key, value } = chunk;

				if (CUMULATIVE_OBJECTS.has(key as any) || key === "teams") {
					// Currently skipped:
					// - meta because it doesn't get written to DB
					// - gameAttributes/startingSeason/version/teams because we already have it from basicInfo.
					return;
				}

				if (key !== prevKey) {
					// console.timeLog("createStream");
					// console.log("loading", key);
					setLeagueCreationStatus(`Processing ${key}...`);
					prevKey = key;
				}

				// Overwrite schedule with known safe gid (higher than any game) in case it is somehow conflicting with games, because schedule gids are not referenced anywhere else but game gids are
				if (key === "schedule" && keptKeys.has("schedule")) {
					currentScheduleGid += 1;
					value.gid = currentScheduleGid;
				}

				if (key === "events" && keptKeys.has("events")) {
					extraFromStream.hasEvents = true;
				}

				const isPlayers = key === "players" && keptKeys.has("players");

				if (isPlayers) {
					if (value.pid === undefined) {
						currentPid += 1;
						value.pid = currentPid;
					} else if (value.pid > currentPid) {
						currentPid = value.pid;
					}
				}

				const processed = await preProcess(key, value, preProcessParams);

				if (
					isPlayers &&
					(processed.tid >= PLAYER.UNDRAFTED ||
						processed.tid === PLAYER.UNDRAFTED_FANTASY_TEMP)
				) {
					extraFromStream.activePlayers.push(processed);

					if (!isSport("basketball") || typeof value.rosterOrder === "number") {
						extraFromStream.teamHasRosterOrder.add(value.tid);
					}
				} else {
					buffer.addRow([key, processed]);
					if (buffer.isFull()) {
						await buffer.flush();
					}
				}
			},

			async close() {
				await buffer.finalize();
			},
		},
		new CountQueuingStrategy({
			highWaterMark,
		}),
	);

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
	teamsCameFromFile,
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
	teamsCameFromFile: boolean;
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

	// Check if we need to set godModeInPast because some custom teams are too powerful
	if (!teamsCameFromFile) {
		// Only for new leagues, not created from file!

		let godModeInPastOverride = false;
		const godModeLimits = newLeagueGodModeLimits();
		for (const t of teamInfos) {
			if (t.pop > godModeLimits.pop) {
				godModeInPastOverride = true;
				break;
			}
			if (
				t.stadiumCapacity !== undefined &&
				t.stadiumCapacity > godModeLimits.stadiumCapacity
			) {
				godModeInPastOverride = true;
				break;
			}
		}
		if (godModeInPastOverride) {
			finalized.godModeInPast = true;
		}
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
	teamSeasons,
	teamStats,
	teams,
}: {
	teamSeasons: TeamSeasonWithoutKey[];
	teamStats: TeamStatsWithoutKey[];
	teams: Team[];
}) => {
	const tx = idb.league.transaction(
		["games", "schedule", "teamSeasons", "teamStats", "teams", "trade"],
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

const processTeamInfos = ({
	realTeamInfo,
	season,
	teamInfos,
	userTid,
}: {
	realTeamInfo: RealTeamInfo | undefined;
	season: number;
	teamInfos: any[];
	userTid: number;
}) => {
	if (realTeamInfo) {
		for (const t of teamInfos) {
			applyRealTeamInfo(t, realTeamInfo, season);

			// This is especially needed for new real players leagues started after the regular season. Arguably makes sense to always do, for consistency, since applyRealTeamInfo will override the current logos anyway, might as well do the historical ones too. But let's be careful.
			if (t.seasons) {
				for (const teamSeason of t.seasons) {
					applyRealTeamInfo(teamSeason, realTeamInfo, teamSeason.season, {
						srIDOverride: teamSeason.srID ?? t.srID,
					});
				}
			}
		}
	}

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

			if (last && last.season !== g.get("season") && !t.disabled) {
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
						// @ts-expect-error
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
	fileHasPlayers,
}: {
	fileHasPlayers: boolean;
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
	if (!fileHasPlayers && g.get("salaryCapType") === "hard") {
		const minContract = g.get("minContract");

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
					if (p.contract.amount >= minContract + 10) {
						payroll -= 10;
						p.contract.amount -= 10;
						foundAny = true;
					} else if (p.contract.amount > minContract) {
						payroll -= p.contract.amount - minContract;
						p.contract.amount = minContract;
						foundAny = true;
					}
				}

				if (!foundAny) {
					throw new Error(
						"Invalid combination of salaryCapType, salaryCap, and minContract - a team full of min contract players is still over the hard cap",
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

type CreateStreamProps = {
	conditions?: Conditions;
	confs: Conf[];
	divs: Div[];
	fromFile: {
		gameAttributes: Record<string, unknown> | undefined;
		hasRookieContracts: boolean;
		maxGid: number | undefined;
		startingSeason: number | undefined;
		teams: any[] | undefined;
		version: number | undefined;
	};
	getLeagueOptions: GetLeagueOptions | undefined;
	keptKeys: Set<string>;
	lid: number;
	name: string;
	setLeagueCreationStatus: (status: string) => void;
	settings: Omit<Settings, "numActiveTeams">;
	shuffleRosters: boolean;
	startingSeasonFromInput: string | undefined;
	teamsFromInput: NewLeagueTeam[];
	tid: number;
};

const beforeDBStream = async ({
	conditions,
	confs,
	divs,
	fromFile,
	getLeagueOptions,
	keptKeys,
	lid,
	name,
	settings,
	startingSeasonFromInput,
	teamsFromInput,
	tid,
}: Pick<
	CreateStreamProps,
	| "conditions"
	| "confs"
	| "divs"
	| "fromFile"
	| "getLeagueOptions"
	| "keptKeys"
	| "lid"
	| "name"
	| "settings"
	| "startingSeasonFromInput"
	| "teamsFromInput"
	| "tid"
>) => {
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

	const filteredFromFile = {
		teams:
			!!fromFile.teams && keptKeys.has("teams") ? fromFile.teams : undefined,
		gameAttributes:
			!!fromFile.gameAttributes && keptKeys.has("gameAttributes")
				? fromFile.gameAttributes
				: undefined,
	};

	let teamInfos = helpers.addPopRank(filteredFromFile.teams ?? teamsFromInput);

	// Validation of some identifiers
	confirmSequential(teamInfos, "tid", "team");

	const gameAttributes = await finalizeGameAttributes({
		conditions,
		// Use fromFile.gameAttributes in addition to gameAttributeOverrides because it preserves history and any non-standard settings
		gameAttributes: filteredFromFile.gameAttributes ?? {},
		gameAttributeOverrides,
		getLeagueOptions,
		randomization,
		startingSeason,
		teamsCameFromFile: !!filteredFromFile.teams,
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
		teamInfos = helpers.addPopRank(teamInfos);
	}

	const { realPlayerPhotos, realTeamInfo } = await getRealTeamPlayerData({
		fileHasPlayers: keptKeys.has("players"),
		fileHasTeams: !!filteredFromFile.teams,
	});

	// Hacky - put gameAttributes in g so they can be seen by functions called from this function
	helpers.resetG();
	gameAttributes.lid = lid;
	Object.assign(g, gameAttributes);

	// Needs to be done after g is set
	const { scoutingRank, teams, teamSeasons, teamStats } = processTeamInfos({
		realTeamInfo,
		season: gameAttributes.season,
		teamInfos,
		userTid: tid,
	});

	// Update after applying real team info
	if (realTeamInfo) {
		gameAttributes.teamInfoCache = teams.map(t => ({
			abbrev: t.abbrev,
			disabled: t.disabled,
			imgURL: t.imgURL,
			imgURLSmall: t.imgURLSmall,
			name: t.name,
			region: t.region,
		}));
	}

	const activeTids = teams.filter(t => !t.disabled).map(t => t.tid);

	await addLeagueMeta({
		lid,
		name,
		teams,
		tid,
	});

	return {
		activeTids,
		averagePopulation,
		gameAttributes,
		noStartingInjuries,
		realPlayerPhotos,
		realTeamInfo,
		repeatSeason,
		scoutingRank,
		teamInfos,
		teamSeasons,
		teamStats,
		teams,
	};
};

const afterDBStream = async ({
	activeTids,
	extraFromStream,
	fromFile,
	gameAttributes,
	getLeagueOptions,
	lid,
	repeatSeason,
	scoutingRank,
	shuffleRosters,
	teamInfos,
	teamSeasons,
	teamStats,
	teams,
}: {
	extraFromStream: ExtraFromStream;
} & Pick<
	CreateStreamProps,
	"fromFile" | "getLeagueOptions" | "lid" | "shuffleRosters"
> &
	Pick<
		Awaited<ReturnType<typeof beforeDBStream>>,
		| "activeTids"
		| "gameAttributes"
		| "repeatSeason"
		| "scoutingRank"
		| "teamInfos"
		| "teamSeasons"
		| "teamStats"
		| "teams"
	>) => {
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
		teamSeasons,
		teamStats,
		teams,
	});

	// Clear old game attributes from g, to make sure the new ones are saved to the db in setGameAttributes
	helpers.resetG();
	g.setWithoutSavingToDB("lid", lid);
	await toUI("resetLeague", []);

	if (idb.cache) {
		idb.cache.stopAutoFlush();
	}

	idb.cache = new Cache();
	idb.cache.newLeague = true;
	await idb.cache.fill(gameAttributes.season);

	const gameAttributesToUpdate: Partial<GameAttributesLeagueWithHistory> = {
		...gameAttributes,
	};

	// Hack! Need to not include lid in the update here, because then it gets sent to the UI and is seen in Controller before the URL changes, which interferes with running beforeLeague when the first view in the new league is loaded. lol
	delete gameAttributesToUpdate.lid;

	// This gets put on in createGameAttributes, but we don't want to write it to DB
	g.setWithoutSavingToDB("teamInfoCache", gameAttributes.teamInfoCache);
	delete gameAttributesToUpdate.teamInfoCache;

	// Write gameAttributes to DB in special way, to get extra functionality from setGameAttributes and because it's not in the database native format in leagueData (object, not array like others).
	// BUT - league.setGameAttributes is not expecting gameAttributes with history, so this could break in subtle ways in the future!
	await league.setGameAttributes(gameAttributesToUpdate as any);

	for (const p of activePlayers) {
		await idb.cache.players.put(p);
	}
	await finalizeActivePlayers({
		fileHasPlayers,
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
			// If league file has players with roster order set, don't auto sort even if skipNewPhase is false
			if (
				!extraFromStream.teamHasRosterOrder.has(t.tid) ||
				!g.get("userTids").includes(t.tid)
			) {
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

	// Set numDraftPicksCurrent, for upgrading leagues
	if (g.get("phase") === PHASE.DRAFT) {
		const currentDraftPicks = await draft.getOrder();
		const draftNotStarted =
			currentDraftPicks.every(dp => dp.round === 0) ||
			currentDraftPicks.some(dp => dp.round === 1 && dp.pick === 1);
		if (draftNotStarted) {
			const numDraftPicksCurrent = currentDraftPicks.length;
			if (numDraftPicksCurrent > 0) {
				await league.setGameAttributes({
					numDraftPicksCurrent,
				});
			}
		}
	}

	// Gregg Brown from DNBA, RIP. Make one player on Denver have his name, assuming it's a random players league, Denver exists, and there are no custom names.
	if (isSport("basketball") && !fileHasPlayers && !g.get("playerBioInfo")) {
		const tid = teams.find(t => t.region === "Denver")?.tid;
		if (tid !== undefined) {
			const players = (
				await idb.cache.players.indexGetAll("playersByTid", tid)
			).filter(p => p.relatives.length === 0);
			const p = random.choice(players);
			if (p) {
				p.firstName = "Gregg";
				p.lastName = "Brown";
				p.born.loc = "Australia";
				p.real = true;
				await idb.cache.players.put(p);
			}
		}
	}

	await idb.cache.flush();
	idb.cache.startAutoFlush();
	local.leagueLoaded = true;
};

const createStream = async (
	stream: ReadableStream,
	{
		conditions,
		confs,
		divs,
		fromFile,
		getLeagueOptions,
		keptKeys,
		lid,
		name,
		setLeagueCreationStatus,
		settings,
		shuffleRosters,
		startingSeasonFromInput,
		teamsFromInput, // use if none in file
		tid,
	}: CreateStreamProps,
) => {
	// console.time("createStream");
	const {
		activeTids,
		averagePopulation,
		gameAttributes,
		noStartingInjuries,
		realPlayerPhotos,
		realTeamInfo,
		repeatSeason,
		scoutingRank,
		teamInfos,
		teamSeasons,
		teamStats,
		teams,
	} = await beforeDBStream({
		conditions,
		confs,
		divs,
		fromFile,
		getLeagueOptions,
		keptKeys,
		lid,
		name,
		settings,
		startingSeasonFromInput,
		teamsFromInput,
		tid,
	});
	// console.timeLog("createStream");

	const { extraFromStream, saveToDB } = await getSaveToDB({
		keptKeys,
		maxGid: fromFile.maxGid,
		preProcessParams: {
			activeTids,
			averagePopulation,
			hasRookieContracts: fromFile.hasRookieContracts,
			noStartingInjuries,
			realPlayerPhotos,
			realTeamInfo,
			scoutingRank,
			version: fromFile.version,
		},
		setLeagueCreationStatus,
	});
	// console.timeLog("createStream");

	await stream.pipeTo(saveToDB);
	// console.timeLog("createStream");

	setLeagueCreationStatus("Finalizing...");

	await afterDBStream({
		activeTids,
		extraFromStream,
		fromFile,
		gameAttributes,
		getLeagueOptions,
		lid,
		repeatSeason,
		scoutingRank,
		shuffleRosters,
		teamInfos,
		teamSeasons,
		teamStats,
		teams,
	});
	// console.timeEnd("createStream");
};

export default createStream;
