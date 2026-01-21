import { csvFormat, csvFormatRows } from "d3-dsv";
import {
	GAME_ACRONYM,
	PHASE,
	PHASE_TEXT,
	PLAYER,
	PLAYER_STATS_TABLES,
	RATINGS,
	isSport,
	bySport,
	gameAttributesArrayToObject,
	DEFAULT_JERSEY,
	POSITIONS,
	GRACE_PERIOD,
	LEAGUE_DATABASE_VERSION,
	REAL_PLAYERS_INFO,
} from "../../common/index.ts";
import actions from "./actions.ts";
import leagueFileUpload, {
	decompressStreamIfNecessary,
	emitProgressStream,
	parseJSON,
} from "./leagueFileUpload.ts";
import processInputs from "./processInputs.ts";
import {
	allStar,
	contractNegotiation,
	draft,
	finances,
	league,
	phase,
	player,
	team,
	trade,
	expansionDraft,
	realRosters,
	freeAgents,
	season,
} from "../core/index.ts";
import { idb } from "../db/index.ts";
import {
	achievement,
	checkAccount,
	checkChanges,
	checkNaNs,
	env,
	face,
	g,
	helpers,
	local,
	lock,
	random,
	updatePlayMenu,
	updateStatus,
	toUI,
	recomputeLocalUITeamOvrs,
	updatePhase,
	logEvent,
	getNewLeagueLid,
	initUILocalGames,
	loadNames,
	defaultInjuries,
	defaultTragicDeaths,
} from "../util/index.ts";
import * as cloudSync from "../util/cloudSync.ts";
import { setCloudIdForLeague, getCloudIdForLeague, removeCloudIdForLeague } from "../../common/cloudTypes.ts";
import views from "../views/index.ts";
import type {
	Conditions,
	Env,
	GameAttributesLeague,
	Local,
	LockName,
	Player,
	PlayerWithoutKey,
	UpdateEvents,
	TradeTeams,
	MinimalPlayerRatings,
	Relative,
	Options,
	ExpansionDraftSetupTeam,
	GetLeagueOptions,
	TeamSeason,
	TeamSeasonWithoutKey,
	ScheduledEventGameAttributes,
	ScheduledEventTeamInfo,
	ScheduleGameWithoutKey,
	Conf,
	Div,
	DunkAttempt,
	AllStarPlayer,
	League,
	RealPlayerPhotos,
	View,
} from "../../common/types.ts";
import {
	addSimpleAndTeamAwardsToAwardsByPlayer,
	type AwardsByPlayer,
	deleteAwardsByPlayer,
	saveAwardsByPlayer,
} from "../core/season/awards.ts";
import { getScore } from "../core/player/checkJerseyNumberRetirement.ts";
import type { NewLeagueTeam } from "../../ui/views/NewLeague/types.ts";
import { PointsFormulaEvaluator } from "../core/team/evaluatePointsFormula.ts";
import type { Settings } from "../views/settings.ts";
import {
	getActualAttendance,
	getAdjustedTicketPrice,
	getAutoTicketPriceByTid,
	getBaseAttendance,
} from "../core/game/attendance.ts";
import goatFormula from "../util/goatFormula.ts";
import getRandomTeams from "./getRandomTeams.ts";
import { withState } from "../core/player/name.ts";
import { initDefaults } from "../util/loadNames.ts";
import type { PlayerRatings } from "../../common/types.basketball.ts";
import createStreamFromLeagueObject from "../core/league/create/createStreamFromLeagueObject.ts";
import type { IDBPIndex, IDBPObjectStore } from "@dumbmatter/idb";
import { upgradeGamesVersion65, type LeagueDB } from "../db/connectLeague.ts";
import playMenu from "./playMenu.ts";
import toolsMenu from "./toolsMenu.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import statsBaseball from "../core/team/stats.baseball.ts";
import { extraRatings } from "../views/playerRatings.ts";
import {
	groupBy,
	groupByUnique,
	maxBy,
	omit,
	orderBy,
	range,
} from "../../common/utils.ts";
import {
	finalizePlayersRelativesList,
	formatPlayerRelativesList,
} from "../views/customizePlayer.ts";
import { TOO_MANY_TEAMS_TOO_SLOW } from "../core/season/getInitialNumGamesConfDivSettings.ts";
import { advancedPlayerSearch } from "./advancedPlayerSearch.ts";
import * as exhibitionGame from "./exhibitionGame.ts";
import { getSummary } from "../views/trade.ts";
import { statTypes } from "../views/playerGraphs.ts";
import {
	getStats as teamGetStats,
	statTypes as teamStatTypes,
} from "../views/teamGraphs.ts";
import { DEFAULT_LEVEL } from "../../common/budgetLevels.ts";
import isUntradable from "../core/trade/isUntradable.ts";
import getWinner from "../../common/getWinner.ts";
import formatScoreWithShootout from "../../common/formatScoreWithShootout.ts";
import { getStats } from "../../common/advancedPlayerSearch.ts";
import type { LookingFor } from "../core/trade/makeItWork.ts";
import type { LookingForState } from "../../ui/views/TradingBlock/useLookingForState.ts";
import { getPlayer } from "../views/player.ts";
import type { NoteInfo } from "../../ui/views/Player/Note.tsx";
import { beforeLeague, beforeNonLeague } from "../util/beforeView.ts";
import loadData from "../core/realRosters/loadData.basketball.ts";
import formatPlayerFactory from "../core/realRosters/formatPlayerFactory.ts";
import { applyRealPlayerPhotos } from "../core/league/processPlayerNewLeague.ts";
import { actualPhase } from "../util/actualPhase.ts";
import getCol from "../../common/getCol.ts";
import getCols from "../../common/getCols.ts";
import { formatScheduleForEditor } from "../views/scheduleEditor.ts";

const acceptContractNegotiation = async ({
	pid,
	amount,
	exp,
}: {
	pid: number;
	amount: number;
	exp: number;
}) => {
	return contractNegotiation.accept({ pid, amount, exp });
};

const addTeam = async () => {
	const did = g.get("divs")[0].did;

	const t = await team.addNewTeamToExistingLeague({
		did,
		region: "Region",
		name: "Name",
		abbrev: "ZZZ",
		pop: 1,
		imgURL: undefined,
	});

	await idb.cache.flush();

	// Team format used in ManageTemas
	return {
		tid: t.tid,
		abbrev: t.abbrev,
		region: t.region,
		name: t.name,
		imgURL: t.imgURL,
		imgURLSmall: t.imgURLSmall ?? "",
		did: t.did,
		disabled: t.disabled,
		jersey: t.jersey ?? DEFAULT_JERSEY,
		pop: t.pop!, // See comment in types.ts about upgrade
		stadiumCapacity: t.stadiumCapacity!, // See comment in types.ts about upgrade
		colors: t.colors,
	};
};

const allStarDraftAll = async () => {
	const pids = await allStar.draftAll();
	return pids;
};

const allStarDraftOne = async () => {
	const { finalized, pid } = await allStar.draftOne();
	return {
		finalized,
		pid,
	};
};

const allStarDraftUser = async (pid: number) => {
	const finalized = await allStar.draftUser(pid);
	return finalized;
};

const allStarDraftReset = async () => {
	const allStars = await idb.cache.allStars.get(g.get("season"));
	if (allStars) {
		allStars.finalized = false;

		// Ideally it would put them back in the same order it started, but that's hard, so just assume draft was old order
		const oldRemaining = allStars.remaining;
		allStars.remaining = [];

		// Interleave teams
		const maxIndex = Math.max(
			allStars.teams[0].length,
			allStars.teams[1].length,
		);
		for (let i = 1; i < maxIndex; i++) {
			for (const t of [0, 1] as const) {
				const p = allStars.teams[t][i];
				if (p) {
					allStars.remaining.push(p);
				}
			}
		}

		allStars.remaining.push(...oldRemaining);

		allStars.teams = [[allStars.teams[0][0]!], [allStars.teams[1][0]!]];

		await idb.cache.allStars.put(allStars);

		await toUI("realtimeUpdate", [["playerMovement"]]);
	}
};

const allStarDraftSetPlayers = async (
	players: {
		teams: [AllStarPlayer[], AllStarPlayer[]];
		remaining: AllStarPlayer[];
	},
	conditions: Conditions,
) => {
	const allStars = await idb.cache.allStars.get(g.get("season"));
	if (allStars) {
		const prevPids = [
			...allStars.teams[0],
			...allStars.teams[1],
			...allStars.remaining,
		].map((p) => p.pid);

		const newPlayers = [
			...players.teams[0],
			...players.teams[1],
			...players.remaining,
		];

		const newPids = newPlayers.map((p) => p.pid);

		const pidsToDelete = prevPids.filter((pid) => !newPids.includes(pid));

		// Delete old awards
		const awardsByPlayerToDelete = pidsToDelete.map((pid) => ({
			pid,
			type: "All-Star",
		}));
		await deleteAwardsByPlayer(awardsByPlayerToDelete, g.get("season"));

		// Add new awards
		const awardsByPlayer = newPlayers
			.filter((p) => !prevPids.includes(p.pid))
			.map((p) => ({
				pid: p.pid,
				tid: p.tid,
				name: p.name,
				type: "All-Star",
			}));
		await saveAwardsByPlayer(awardsByPlayer, conditions);

		// Save new All-Stars
		allStars.teams = players.teams;
		allStars.remaining = players.remaining;
		if (allStars.type === "draft") {
			for (const i of [0, 1] as const) {
				const p = await idb.cache.players.get(allStars.teams[i][0]!.pid);
				if (p) {
					allStars.teamNames[i] = `Team ${p.firstName}`;
				}
			}
		}
		await idb.cache.allStars.put(allStars);

		await toUI("realtimeUpdate", [["playerMovement"]]);
	}
};

const allStarGameNow = async () => {
	const currentPhase = g.get("phase");
	if (
		currentPhase != PHASE.REGULAR_SEASON &&
		currentPhase !== PHASE.AFTER_TRADE_DEADLINE
	) {
		return;
	}

	let schedule = (await season.getSchedule()).map((game) => {
		const newGame: ScheduleGameWithoutKey = {
			...game,
		};
		// Delete gid, so ASG added to beginning will be in order
		delete newGame.gid;
		return newGame;
	});

	// Does ASG exist in schedule? If so, delete it.
	schedule = schedule.filter(
		(game) => game.awayTid !== -2 || game.homeTid !== -1,
	);

	// Add 1 to each day, so we can fit in ASG
	for (const game of schedule) {
		game.day += 1;
	}

	// Add new ASG to front of schedule, and adjust days
	schedule.unshift({
		awayTid: -2,
		homeTid: -1,
		day: schedule[0] ? schedule[0].day - 1 : 0,
	});

	await idb.cache.schedule.clear();
	for (const game of schedule) {
		await idb.cache.schedule.add(game);
	}

	await initUILocalGames();
	await updatePlayMenu();
	await toUI("realtimeUpdate", [["gameSim"]]);
};

const autoSortRoster = async ({
	pos,
	tids,
}: {
	pos?: string;
	tids?: number[];
} = {}) => {
	const tids2 = tids ?? [g.get("userTid")];

	for (const tid of tids2) {
		await team.rosterAutoSort(
			tid,
			false,
			typeof pos === "string" ? pos : undefined,
		);
	}
	await toUI("realtimeUpdate", [["playerMovement"]]);
};

const beforeView = async (
	{
		inLeague,
		lidCurrent,
		lidUrl,
	}: {
		inLeague: boolean;
		lidCurrent: number | undefined;
		lidUrl: number | undefined;
	},
	conditions: Conditions,
) => {
	if (inLeague) {
		// idb.league check is for Safari weirdness - seems we need to reinitialize state sometimes because it is lost? idk
		if (
			lidUrl !== undefined &&
			(lidUrl !== lidCurrent || idb.league === undefined)
		) {
			await beforeLeague(lidUrl, conditions);
		}
	} else {
		// TEMP DISABLE WITH ESLINT 9 UPGRADE eslint-disable-next-line no-lonely-if
		if (lidCurrent !== undefined) {
			await beforeNonLeague(conditions);
		}
	}
};

const cancelContractNegotiation = async (pid: number) => {
	const result = await contractNegotiation.cancel(pid);
	await toUI("realtimeUpdate", [["playerMovement"]]);
	return result;
};

const checkAccount2 = (param: unknown, conditions: Conditions) =>
	checkAccount(conditions);

const checkParticipationAchievement = async (
	force: boolean,
	conditions: Conditions,
) => {
	if (force) {
		await achievement.add(["participation"], conditions, "normal");
	} else {
		const achievements = await achievement.getAll();
		const participationAchievement = achievements.find(
			({ slug }) => slug === "participation",
		);

		if (participationAchievement && participationAchievement.normal === 0) {
			await achievement.add(["participation"], conditions, "normal");
		}
	}
};

const clearInjuries = async (pids: number[] | "all") => {
	const players =
		pids === "all"
			? await idb.cache.players.getAll()
			: await idb.getCopies.players({ pids }, "noCopyCache");

	for (const p of players) {
		if (p.injury.gamesRemaining > 0) {
			// Adjust injuries log
			const lastInjuriesEntry = p.injuries.at(-1);
			if (lastInjuriesEntry?.type === p.injury.type) {
				lastInjuriesEntry.games -= p.injury.gamesRemaining;
				if (lastInjuriesEntry.games <= 0) {
					// Injury was cleared before any days were simmed
					p.injuries.pop();
				}
			}

			p.injury = {
				type: "Healthy",
				gamesRemaining: 0,
			};
			await idb.cache.players.put(p);
		}
	}

	await toUI("realtimeUpdate", [["playerMovement"]]);
	await recomputeLocalUITeamOvrs();
};

const noteUpdateEvents: Record<NoteInfo["type"], UpdateEvents> = {
	draftPick: ["notes", "playerMovement"],
	game: ["notes"],
	player: ["notes", "playerMovement"],
	teamSeason: ["notes", "team"],
};

const clearNotes = async (type: NoteInfo["type"]) => {
	const storeName = `${type}s` as const;
	const rows = await idb.getCopies[storeName](
		{
			note: true,
		},
		"noCopyCache",
	);
	for (const row of rows) {
		delete row.note;
		delete row.noteBool;
		await idb.cache[storeName].put(row as any);
	}

	await toUI("realtimeUpdate", [noteUpdateEvents[type]]);
};

const getUpdateWatch = (players: Player[]) => {
	const updateWatch: Record<number, number> = {};
	for (const p of players) {
		updateWatch[p.pid] = p.watch ?? 0;
	}
	return updateWatch;
};

const clearWatchList = async (type: "all" | number) => {
	const players = await idb.getCopies.players(
		{
			watch: true,
		},
		"noCopyCache",
	);
	for (const p of players) {
		if (type === "all" || p.watch === type) {
			delete p.watch;
			await idb.cache.players.put(p);
		}
	}

	await Promise.all([
		toUI("crossTabEmit", [["updateWatch", getUpdateWatch(players)]]),
		toUI("realtimeUpdate", [["playerMovement", "watchList"]]),
	]);
};

const countNegotiations = async () => {
	const negotiations = await idb.cache.negotiations.getAll();
	return negotiations.length;
};

const createLeague = async (
	{
		name,
		tid,
		file,
		url,
		shuffleRosters,
		importLid,
		getLeagueOptions,
		keptKeys,
		confs,
		divs,
		teamsFromInput,
		settings,
		fromFile,
		startingSeasonFromInput,
		leagueCreationID,
	}: {
		name: string;
		tid: number;
		file: File | undefined;
		url: string | undefined;
		shuffleRosters: boolean;
		importLid: number | undefined | null;
		getLeagueOptions: GetLeagueOptions | undefined;
		keptKeys: string[];
		confs: Conf[];
		divs: Div[];
		teamsFromInput: NewLeagueTeam[];
		settings: Omit<Settings, "numActiveTeams">;
		fromFile: {
			gameAttributes: Record<string, unknown> | undefined;
			hasRookieContracts: boolean;
			maxGid: number | undefined;
			startingSeason: number | undefined;
			teams: any[] | undefined;
			version: number | undefined;
		};
		startingSeasonFromInput: string | undefined;
		leagueCreationID: number;
	},
	conditions: Conditions,
): Promise<number> => {
	const keys = new Set([...keptKeys, "startingSeason", "version"]);

	const setLeagueCreationStatus = (status: string) => {
		toUI(
			"updateLocal",
			[
				{
					leagueCreation: {
						id: leagueCreationID,
						status,
					},
				},
			],
			conditions,
		);
	};

	setLeagueCreationStatus("Initializing...");

	let actualTid = tid;
	let stream: ReadableStream | undefined;
	if (getLeagueOptions) {
		const realLeague = await realRosters.getLeague(getLeagueOptions);

		if (getLeagueOptions.type === "real") {
			if (getLeagueOptions.realStats === "all") {
				keys.add("awards");
				keys.add("playoffSeries");
			}

			if (getLeagueOptions.phase >= PHASE.PLAYOFFS) {
				keys.add("awards");
				keys.add("draftLotteryResults");
				keys.add("draftPicks");
				keys.add("playoffSeries");
			}
		}

		// Since inactive teams are included if realStats=="all", need to translate tid and overwrite fromFile.teams
		if (
			getLeagueOptions.type === "real" &&
			getLeagueOptions.realStats === "all"
		) {
			const srID = fromFile.teams![tid].srID;
			actualTid = realLeague.teams.findIndex((t) => t.srID === srID);
			if (!srID || actualTid < 0) {
				throw new Error("Error finding tid");
			}
		}

		// Definitley need this for realStats=="all", but maybe elsewhere too. This is needed because we don't know if we're keeping history or not when we call getLeagueInfo to display the team/settings in the UI.
		fromFile.gameAttributes = realLeague.gameAttributes;
		fromFile.startingSeason = realLeague.startingSeason;
		fromFile.teams = realLeague.teams;

		stream = createStreamFromLeagueObject(realLeague);
	} else if (file || url) {
		let baseStream: ReadableStream;
		let sizeInBytes: number | undefined;
		if (file) {
			baseStream = file.stream();
			sizeInBytes = file.size;
		} else {
			const response = await fetch(url!);
			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}`);
			}
			baseStream = response.body as ReadableStream;
			const size = response.headers.get("content-length");
			if (size) {
				sizeInBytes = Number(size);
			}
		}

		const stream0 = baseStream;

		// I HAVE NO IDEA WHY THIS LINE IS NEEDED, but without this, Firefox seems to cut the stream off early
		(self as any).stream0 = stream0;

		stream = (
			await decompressStreamIfNecessary(
				stream0.pipeThrough(
					emitProgressStream(leagueCreationID, sizeInBytes, conditions),
				),
			)
		)
			.pipeThrough(new TextDecoderStream())
			.pipeThrough(parseJSON());
	} else {
		stream = createStreamFromLeagueObject({});
	}

	if (!stream) {
		throw new Error("No stream");
	}

	const lid = importLid ?? (await getNewLeagueLid());

	await league.createStream(stream, {
		conditions,
		confs,
		divs,
		fromFile,
		getLeagueOptions,
		lid,
		keptKeys: keys,
		name,
		setLeagueCreationStatus,
		settings,
		shuffleRosters,
		startingSeasonFromInput,
		teamsFromInput,
		tid: actualTid,
	});

	delete (self as any).stream0;

	if (settings.giveMeWorstRoster) {
		await league.swapWorstRoster(false);
	}

	toUI(
		"updateLocal",
		[
			{
				leagueCreation: undefined,
			},
		],
		conditions,
	);

	return lid;
};

const deleteOldData = async (options: {
	boxScores: boolean;
	events: boolean;
	teamStats: boolean;
	teamHistory: boolean;
	retiredPlayersUnnotable: boolean;
	retiredPlayers: boolean;
	playerStatsUnnotable: boolean;
	playerStats: boolean;
}) => {
	const transaction = idb.league.transaction(
		[
			"allStars",
			"draftLotteryResults",
			"events",
			"games",
			"headToHeads",
			"teams",
			"teamSeasons",
			"teamStats",
			"players",
		],
		"readwrite",
	);

	if (options.boxScores) {
		transaction.objectStore("games").clear();
	}

	if (options.teamHistory) {
		for await (const cursor of transaction.objectStore("teamSeasons")) {
			if (cursor.value.season < g.get("season")) {
				await cursor.delete();
			}
		}

		transaction.objectStore("draftLotteryResults").clear();

		transaction.objectStore("headToHeads").clear();

		for await (const cursor of transaction.objectStore("allStars")) {
			if (cursor.value.season < g.get("season")) {
				await cursor.delete();
			}
		}

		for await (const cursor of transaction.objectStore("teams")) {
			const t = cursor.value;
			t.retiredJerseyNumbers = [];
			await cursor.update(t);
		}
	}

	if (options.teamStats) {
		for await (const cursor of transaction.objectStore("teamStats")) {
			if (cursor.value.season < g.get("season")) {
				await cursor.delete();
			}
		}
	}

	if (options.retiredPlayers) {
		for await (const cursor of transaction
			.objectStore("players")
			.index("tid")
			.iterate(PLAYER.RETIRED)) {
			await cursor.delete();
		}
	} else if (options.retiredPlayersUnnotable) {
		for await (const cursor of transaction
			.objectStore("players")
			.index("tid")
			.iterate(PLAYER.RETIRED)) {
			const p = cursor.value;
			if (p.awards.length === 0 && !p.statsTids.includes(g.get("userTid"))) {
				await cursor.delete();
			}
		}
	}

	const deletePlayerStats = (p: Player) => {
		let updated = false;
		if (p.ratings.length > 0) {
			updated = true;
			const latestSeason = p.ratings.at(-1)?.season;
			p.ratings = p.ratings.filter((row) => row.season >= latestSeason) as any;
		}
		if (p.stats.length > 0) {
			updated = true;
			let latestSeason = g.get("season");
			if (g.get("phase") === PHASE.PRESEASON) {
				latestSeason -= 1;
			}
			p.stats = p.stats.filter((row) => row.season >= latestSeason);
		}
		if (p.injuries.length > 0) {
			if (
				p.injuries.length >= 1 &&
				(p.injury.gamesRemaining > 0 || p.injury.type !== "Healthy")
			) {
				if (p.injuries.length > 1) {
					p.injuries = [p.injuries.at(-1)!];
					updated = true;
				}
			} else {
				p.injuries = [];
				updated = true;
			}
		}
		if (p.salaries.length > 0) {
			if (p.tid < 0) {
				p.salaries = [];
			} else {
				const minSeasonKeep =
					g.get("phase") > PHASE.PLAYOFFS
						? g.get("season") + 1
						: g.get("season");
				let minIndexKeep = Infinity;
				for (const [i, row] of p.salaries.entries()) {
					if (row.season === minSeasonKeep) {
						// Keep latest contract that covers the current season - handles the case of old released contracts that would have also covered this season
						minIndexKeep = i;
					}
				}
				const lengthBefore = p.salaries.length;
				p.salaries = p.salaries.slice(minIndexKeep);
				if (lengthBefore > p.salaries.length) {
					updated = true;
				}
			}
		}

		if (updated) {
			return p;
		}
	};

	if (options.playerStats) {
		for await (const cursor of transaction.objectStore("players")) {
			const p = cursor.value;
			const p2 = deletePlayerStats(p);
			if (p2) {
				await cursor.update(p2);
			}
		}
	} else if (options.playerStatsUnnotable) {
		for await (const cursor of transaction.objectStore("players")) {
			const p = cursor.value;
			if (p.awards.length === 0 && !p.statsTids.includes(g.get("userTid"))) {
				const p2 = deletePlayerStats(p);
				if (p2) {
					await cursor.update(p2);
				}
			}
		}
	}

	if (options.events) {
		transaction.objectStore("events").clear();
	}

	await transaction.done;

	// Without this, cached values will still exist
	await idb.cache.fill();
};

const deleteFromGameAttributesScheduledEvent = async (
	keys: (keyof ScheduledEventGameAttributes["info"])[],
	event: ScheduledEventGameAttributes & { id: number },
) => {
	let updated = false;
	for (const key of keys) {
		if (event.info[key] !== undefined) {
			delete event.info[key];
			updated = true;
		}
	}

	if (Object.keys(event.info).length === 0) {
		await idb.cache.scheduledEvents.delete(event.id);
	} else if (updated) {
		await idb.cache.scheduledEvents.put(event);
	}
};

const deleteFromTeamInfoScheduledEvent = async (
	keys: (keyof ScheduledEventTeamInfo["info"])[],
	event: ScheduledEventTeamInfo & { id: number },
) => {
	let updated = false;
	for (const key of keys) {
		if (event.info[key] !== undefined) {
			delete event.info[key];
			updated = true;
		}
	}

	const keys2 = Object.keys(event.info);
	if (
		keys2.length <= 1 ||
		(keys2.length === 2 && keys2.includes("tid") && keys2.includes("srID"))
	) {
		await idb.cache.scheduledEvents.delete(event.id);
	} else if (updated) {
		await idb.cache.scheduledEvents.put(event);
	}
};

const deleteScheduledEvents = async (type: string) => {
	const scheduledEvents = await idb.getCopies.scheduledEvents(
		undefined,
		"noCopyCache",
	);

	const deletedExpansionTIDs: number[] = [];

	for (const event of scheduledEvents) {
		if (type === "all") {
			await idb.cache.scheduledEvents.delete(event.id);
		} else if (type === "expansionDraft") {
			if (event.type === "expansionDraft") {
				deletedExpansionTIDs.push(...event.info.teams.map((t) => t.tid));
				await idb.cache.scheduledEvents.delete(event.id);
			}

			if (
				(event.type === "contraction" || event.type === "teamInfo") &&
				deletedExpansionTIDs.includes(event.info.tid)
			) {
				await idb.cache.scheduledEvents.delete(event.id);
			}
		} else if (type === "contraction") {
			if (event.type === "contraction") {
				await idb.cache.scheduledEvents.delete(event.id);
			}
		} else if (type === "unretirePlayer") {
			if (event.type === "unretirePlayer") {
				await idb.cache.scheduledEvents.delete(event.id);
			}
		} else if (type === "teamInfo") {
			if (event.type === "teamInfo") {
				await deleteFromTeamInfoScheduledEvent(
					[
						"region",
						"name",
						"pop",
						"abbrev",
						"imgURL",
						"imgURLSmall",
						"colors",
						"jersey",
					],
					event,
				);
			}
		} else if (type === "confs") {
			if (event.type === "teamInfo") {
				// cid is legacy
				await deleteFromTeamInfoScheduledEvent(["cid", "did"] as any, event);
			}

			if (event.type === "gameAttributes") {
				await deleteFromGameAttributesScheduledEvent(["confs", "divs"], event);
			}
		} else if (type === "finance") {
			if (event.type === "gameAttributes") {
				await deleteFromGameAttributesScheduledEvent(
					[
						"luxuryPayroll",
						"maxContract",
						"minContract",
						"minPayroll",
						"salaryCap",
						"salaryCapType",
						"luxuryTax",
					],
					event,
				);
			}
		} else if (type === "rules") {
			if (event.type === "gameAttributes") {
				await deleteFromGameAttributesScheduledEvent(
					[
						"numGamesPlayoffSeries",
						"numPlayoffByes",
						"numGames",
						"draftType",
						"threePointers",
						"foulsUntilBonus",
						"playIn",
						"numGamesConf",
						"numGamesDiv",
						"allStarType",
						"elamASG",
						"allStarDunk",
						"allStarThree",
					],
					event,
				);
			}
		} else if (type === "styleOfPlay") {
			if (event.type === "gameAttributes") {
				await deleteFromGameAttributesScheduledEvent(
					[
						"pace",
						"threePointTendencyFactor",
						"threePointAccuracyFactor",
						"twoPointAccuracyFactor",
						"ftAccuracyFactor",
						"blockFactor",
						"stealFactor",
						"turnoverFactor",
						"orbFactor",
					],
					event,
				);
			}
		}
	}

	await toUI("realtimeUpdate", [["scheduledEvents"]]);
};

const discardUnsavedProgress = async () => {
	const lid = g.get("lid");
	await league.close(true);
	await beforeLeague(lid);
};

const draftLottery = async () => {
	const { draftLotteryResult } = await draft.genOrder();
	return draftLotteryResult;
};

const draftUser = async (pid: number, conditions: Conditions) => {
	if (lock.get("drafting")) {
		return;
	}

	const draftPicks = await draft.getOrder();
	const dp = draftPicks[0];

	if (dp && g.get("userTids").includes(dp.tid)) {
		draftPicks.shift();
		await draft.selectPlayer(dp, pid);
		await draft.afterPicks(draftPicks.length === 0, conditions);
	}
};

const dunkGetProjected = async ({
	dunkAttempt,
	index,
}: {
	dunkAttempt: DunkAttempt;
	index: number;
}) => {
	let score = 0;
	let prob = 0;

	const allStars = await idb.cache.allStars.get(g.get("season"));
	const dunk = allStars?.dunk;
	if (dunk?.players[index]) {
		const pid = dunk.players[index].pid;
		const p = await idb.cache.players.get(pid);
		if (p) {
			score = helpers.bound(
				allStar.dunkContest.getDunkScoreRaw(dunkAttempt),
				allStar.dunkContest.LOWEST_POSSIBLE_SCORE,
				allStar.dunkContest.HIGHEST_POSSIBLE_SCORE,
			);

			const difficulty = allStar.dunkContest.getDifficulty(dunkAttempt);
			prob = allStar.dunkContest.difficultyToProbability(
				difficulty,
				allStar.dunkContest.getDunkerRating(p.ratings.at(-1) as PlayerRatings),
			);
		}
	}

	return {
		score,
		prob,
	};
};

const dunkSetControlling = async (controlling: number[]) => {
	const allStars = await idb.cache.allStars.get(g.get("season"));
	const dunk = allStars?.dunk;
	if (dunk) {
		dunk.controlling = controlling;
		await idb.cache.allStars.put(allStars);
		await toUI("realtimeUpdate", [["allStarDunk"]]);
	}
};

const contestSetPlayers = async ({
	type,
	players,
}: {
	type: "dunk" | "three";
	players: AllStarPlayer[];
}) => {
	const allStars = await idb.cache.allStars.get(g.get("season"));
	const contest = allStars?.[type];
	if (contest) {
		contest.players = players;
		await idb.cache.allStars.put(allStars);
		await toUI("realtimeUpdate", [
			[`allStar${helpers.upperCaseFirstLetter(type)}`],
		]);
	}
};

const dunkSimNext = async (
	type: "event" | "dunk" | "round" | "all" | "your",
	conditions: Conditions,
) => {
	if (type === "your") {
		const allStars = await idb.cache.allStars.get(g.get("season"));
		const dunk = allStars?.dunk;
		if (dunk) {
			while (true) {
				const awaitingUserDunkIndex =
					allStar.dunkContest.getAwaitingUserDunkIndex(dunk);
				if (awaitingUserDunkIndex !== undefined) {
					// Found user dunk
					break;
				}

				const newType = await allStar.dunkContest.simNextDunkEvent(conditions);
				if (newType === "all") {
					// Contest over
					break;
				}
			}
		}
	} else {
		const types: (typeof type)[] = ["event", "dunk", "round", "all"];

		// Each call to simNextDunkEvent returns one of `type`. Stopping condition is satisfied if we hit the requested `type`, or any `type` that is after it in `types`.

		const targetIndex = types.indexOf(type);

		while (true) {
			const newType = await allStar.dunkContest.simNextDunkEvent(conditions);
			const newIndex = types.indexOf(newType);
			if (newIndex >= targetIndex) {
				break;
			}
		}
	}

	await toUI("realtimeUpdate", [["allStarDunk"]]);
};

const takeControlTeam = async (userTid: number) => {
	if (g.get("userTids").includes(userTid)) {
		await league.setGameAttributes({
			userTid,
		});
	} else {
		await league.setGameAttributes({
			userTid,
			userTids: [userTid],
		});
	}

	await toUI("realtimeUpdate", [["gameAttributes"]]);
};

const threeSimNext = async (
	type: "event" | "rack" | "player" | "round" | "all",
	conditions: Conditions,
) => {
	const types: (typeof type)[] = ["event", "rack", "player", "round", "all"];

	// Each call to simNextThreeEvent returns one of `type`. Stopping condition is satisfied if we hit the requested `type`, or any `type` that is after it in `types`.

	const targetIndex = types.indexOf(type);

	while (true) {
		const newType = await allStar.threeContest.simNextThreeEvent(conditions);
		const newIndex = types.indexOf(newType);
		if (newIndex >= targetIndex) {
			break;
		}
	}

	await toUI("realtimeUpdate", [["allStarThree"]]);
};

const dunkUser = async (
	{ dunkAttempt, index }: { dunkAttempt: DunkAttempt; index: number },
	conditions: Conditions,
) => {
	await allStar.dunkContest.simNextDunkEvent(conditions, {
		dunkAttempt,
		index,
	});
	await toUI("realtimeUpdate", [["allStarDunk"]]);
};

const evalOnWorker = async (code: string) => {
	const logOutput: (string | boolean | number)[] = [];

	const originalLog = console.log;
	const originalTable = console.table;

	const log = (x: unknown) => {
		if (x === undefined) {
			return;
		}

		if (
			typeof x === "string" ||
			typeof x === "boolean" ||
			typeof x === "number"
		) {
			logOutput.push(x);
		} else {
			try {
				const json = JSON.stringify(x);
				logOutput.push(json);
			} catch (error) {
				logOutput.push(
					`Can only log JSON-serializable variables: ${error.message}`,
				);
			}
		}
	};

	const table = (rows: any[], inputColumns?: string[]) => {
		const csv = csvFormat(rows, inputColumns);
		logOutput.push(csv);
	};

	console.log = log;
	console.table = table;

	try {
		// https://stackoverflow.com/a/63972569/786644
		// eslint-disable-next-line prefer-arrow-callback
		await Object.getPrototypeOf(async function () {}).constructor(code)();

		if (logOutput.length > 0) {
			return logOutput.join("\n");
		}
	} finally {
		console.log = originalLog;
		console.table = originalTable;
	}
};

// exportPlayerAveragesCsv(2015) - just 2015 stats
// exportPlayerAveragesCsv("all") - all stats
const exportPlayerAveragesCsv = async (season: number | "all") => {
	let players: Player<MinimalPlayerRatings>[];

	if (g.get("season") === season && g.get("phase") <= PHASE.PLAYOFFS) {
		players = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);
	} else if (season === "all") {
		players = await idb.getCopies.players(
			{
				activeAndRetired: true,
			},
			"noCopyCache",
		);
	} else {
		players = await idb.getCopies.players(
			{
				activeSeason: season,
			},
			"noCopyCache",
		);
	}

	// Array of seasons in stats, either just one or all of them
	let seasons;

	if (season === "all") {
		seasons = Array.from(
			new Set(players.flatMap((p) => p.ratings).map((pr) => pr.season)),
		);
	} else {
		seasons = [season];
	}

	const ratings = [...RATINGS, ...extraRatings];

	let stats: string[] = [];

	for (const table of Object.values(PLAYER_STATS_TABLES)) {
		if (table) {
			stats.push(
				...table.stats.filter((stat) => {
					if (stat.endsWith("Max")) {
						return false;
					}

					if (isSport("baseball")) {
						if (stat === "pos") {
							return false;
						}

						if (
							statsBaseball.byPos &&
							statsBaseball.byPos.includes(stat as any)
						) {
							return false;
						}
					}

					return true;
				}),
			);
		}
	}

	// Ugh
	const shotLocationsGetCols = (cols: string[]) => {
		const colNames: string[] = [];
		const overrides = {
			"stat:fgAtRim": "AtRimFG",
			"stat:fgaAtRim": "AtRimFGA",
			"stat:fgpAtRim": "AtRimFGP",
			"stat:fgLowPost": "LowPostFG",
			"stat:fgaLowPost": "LowPostFGA",
			"stat:fgpLowPost": "LowPostFGP",
			"stat:fgMidRange": "MidRangeFG",
			"stat:fgaMidRange": "MidRangeFGA",
			"stat:fgpMidRange": "MidRangeFGP",
		};
		for (const col of cols) {
			// @ts-expect-error
			if (overrides[col]) {
				// @ts-expect-error
				colNames.push(overrides[col]);
			} else {
				const col2 = getCol(col);
				colNames.push(col2.title);
			}
		}

		return colNames;
	};

	stats = Array.from(new Set(stats));
	const columns = [
		"pid",
		"Name",
		"Pos",
		"DraftPick",
		"Age",
		"Salary",
		"Team",
		"Season",
		...shotLocationsGetCols(stats.map((stat) => `stat:${stat}`)),
		"Ovr",
		"Pot",
		...getCols(RATINGS.map((rating) => `rating:${rating}`)).map(
			(col) => col.title,
		),
		...getCols(
			extraRatings.length
				? ["ovr", "pot"].flatMap((prefix) =>
						POSITIONS.map((pos) => `rating:${prefix}${pos}`),
					)
				: [],
		).map((col) => col.title),
	];
	const rows: any[] = [];

	for (const s of seasons) {
		console.log(s, new Date());
		const players2 = await idb.getCopies.playersPlus(players, {
			attrs: ["pid", "name", "age", "draft", "salary"],
			ratings: ["pos", "ovr", "pot", ...ratings],
			stats: ["abbrev", ...stats],
			season: s,
		});

		for (const p of players2) {
			rows.push([
				p.pid,
				p.name,
				p.ratings.pos,
				p.draft.round > 0 && p.draft.pick > 0
					? (p.draft.round - 1) * 30 + p.draft.pick
					: "",
				p.age,
				p.salary,
				p.stats.abbrev,
				s,
				...stats.map((stat) => p.stats[stat]),
				p.ratings.ovr,
				p.ratings.pot,
				...RATINGS.map((rating) => p.ratings[rating]),
				...(extraRatings.length
					? ["ovrs", "pots"].flatMap((type) =>
							POSITIONS.map((pos) => p.ratings[type][pos]),
						)
					: []),
			]);
		}
	}

	return csvFormatRows([columns, ...rows]);
};

// exportPlayerGamesCsv(2015) - just 2015 games
// exportPlayerGamesCsv("all") - all games
const exportPlayerGamesCsv = async (season: number | "all") => {
	const columns = [
		"gid",
		"pid",
		"Name",
		"Pos",
		"Team",
		"Opp",
		"Score",
		"WL",
		"Season",
		"Playoffs",
		"Min",
		"FGM",
		"FGA",
		"FG%",
		"3PM",
		"3PA",
		"3P%",
		"FTM",
		"FTA",
		"FT%",
		"ORB",
		"DRB",
		"TRB",
		"AST",
		"TO",
		"STL",
		"BLK",
		"BA",
		"PF",
		"PTS",
		"+/-",
	];

	await idb.cache.flush();

	let storeOrIndex:
		| IDBPObjectStore<LeagueDB, ["games"], "games", "readonly">
		| IDBPIndex<LeagueDB, ["games"], "games", "season", "readonly"> =
		idb.league.transaction("games").store;
	let keyRange = undefined;

	if (season !== "all") {
		storeOrIndex = storeOrIndex.index("season");
		keyRange = IDBKeyRange.only(season);
	}

	let cursor = await storeOrIndex.openCursor(keyRange);

	const rows: any[] = [];

	while (cursor) {
		const { gid, playoffs, season, teams } = cursor.value;

		for (const i of [0, 1] as const) {
			const j = i === 0 ? 1 : 0;
			const t = teams[i];
			const t2 = teams[j];

			for (const p of t.players) {
				const winner = getWinner([t, t2]);
				const result = winner === i ? "W" : winner === j ? "L" : "T";

				rows.push([
					gid,
					p.pid,
					p.name,
					p.pos,
					g.get("teamInfoCache")[t.tid]?.abbrev,
					g.get("teamInfoCache")[t2.tid]?.abbrev,
					formatScoreWithShootout(t, t2),
					result,
					season,
					playoffs,
					p.min,
					p.fg,
					p.fga,
					p.fgp,
					p.tp,
					p.tpa,
					p.tpp,
					p.ft,
					p.fta,
					p.ftp,
					p.orb,
					p.drb,
					p.drb + p.orb,
					p.ast,
					p.tov,
					p.stl,
					p.blk,
					p.ba,
					p.pf,
					p.pts,
					p.pm,
				]);
			}
		}
		cursor = await cursor.continue();
	}

	return csvFormatRows([columns, ...rows]);
};

const getExportFilename = async (type: "league" | "players") => {
	const leagueName = (await league.getName()).replace(/[^\da-z]/gi, "_");

	if (type === "league") {
		const phase = g.get("phase");
		const season = g.get("season");
		const userTid = g.get("userTid");

		let filename = `${GAME_ACRONYM}_${leagueName}_${g.get(
			"season",
		)}_${PHASE_TEXT[phase].replace(/[^\da-z]/gi, "_")}`;

		if (
			phase === PHASE.REGULAR_SEASON ||
			phase === PHASE.AFTER_TRADE_DEADLINE
		) {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[userTid, season],
			);
			if (teamSeason) {
				filename += `_${teamSeason.won}-${teamSeason.lost}`;
			}
		}

		if (phase === PHASE.PLAYOFFS) {
			const playoffSeries = await idb.cache.playoffSeries.get(season);
			if (playoffSeries) {
				const rnd = playoffSeries.currentRound;
				if (rnd < 0) {
					filename += "_Play-In";
				} else if (playoffSeries.series.length > 0) {
					filename += `_Round_${playoffSeries.currentRound + 1}`;

					// Find the latest playoff series with the user's team in it
					const roundSeries = playoffSeries.series[rnd];
					if (roundSeries) {
						for (const series of roundSeries) {
							if (series.home.tid === userTid) {
								if (series.away) {
									filename += `_${series.home.won}-${series.away.won}`;
								} else {
									filename += "_bye";
								}
							} else if (series.away && series.away.tid === userTid) {
								filename += `_${series.away.won}-${series.home.won}`;
							}
						}
					}
				}
			}
		}

		return `${filename}.json`;
	} else if (type === "players") {
		return `${GAME_ACRONYM}_players_${leagueName}_${g.get("season")}.json`;
	}

	throw new Error("Not implemented");
};

const exportDraftClass = async ({
	season,
	retiredPlayers,
}: {
	season: number;
	retiredPlayers?: boolean;
}) => {
	const onlyUndrafted =
		!retiredPlayers &&
		(season > g.get("season") ||
			(season === g.get("season") &&
				g.get("phase") >= 0 &&
				g.get("phase") <= PHASE.DRAFT_LOTTERY));

	let players = await idb.getCopies.players(
		retiredPlayers
			? {
					retiredYear: season,
				}
			: {
					draftYear: season,
				},
		"noCopyCache",
	);

	// For exporting future draft classes (most common use case), the user might have manually changed the tid of some players, in which case we need this check to ensure that the exported draft class matches the draft class shown in the UI
	if (onlyUndrafted) {
		players = players.filter((p) => p.tid === PLAYER.UNDRAFTED);
	}

	const data: any = {
		version: idb.league.version,
		startingSeason: season,
		players: players.map((p) => ({
			born: p.born,
			college: p.college,
			draft: {
				...p.draft,
				round: 0,
				pick: 0,
				tid: -1,
				originalTid: -1,
				year: season,
			},
			face: p.face,
			firstName: p.firstName,
			hgt: p.hgt,
			imgURL: p.imgURL,
			injury: p.injury,
			injuries: p.injuries,
			lastName: p.lastName,
			pid: p.pid,
			pos: p.pos,
			ratings: [p.ratings[retiredPlayers ? p.ratings.length - 1 : 0]],
			stats: p.stats,
			real: p.real,
			relatives: p.relatives,
			srID: p.srID,
			tid: PLAYER.UNDRAFTED,
			weight: p.weight,
		})),
	};

	// When exporting a past draft class, don't include current injuries
	if (
		season < g.get("season") ||
		(season === g.get("season") && g.get("phase") > PHASE.DRAFT)
	) {
		for (const p of data.players) {
			delete p.injury;
			delete p.injuries;
		}
	}

	const leagueName = (await league.getName()).replace(/[^\da-z]/gi, "_");
	const filename = `${GAME_ACRONYM}_${
		retiredPlayers ? "retired" : "draft"
	}_class_${leagueName}_${season}.json`;

	return {
		filename,
		json: JSON.stringify(data, null, 2),
	};
};

const generateFace = async (country: string | undefined) => {
	const { race } = await player.name(
		country ? helpers.getCountry(country) : undefined,
	);
	return face.generate({ race });
};

const getAutoPos = (ratings: any) => {
	const boundedRatings = {
		...ratings,
	};
	for (const key of RATINGS) {
		boundedRatings[key] = player.limitRating(boundedRatings[key]);
	}
	return player.pos(boundedRatings);
};

const getBornLoc = async (pid: number) => {
	const p = await idb.getCopy.players({ pid });
	if (p) {
		return p.born.loc;
	}
};

const getDefaultInjuries = () => {
	return defaultInjuries;
};

const getDefaultNewLeagueSettings = async () => {
	const overrides = (await idb.meta.get(
		"attributes",
		"defaultSettingsOverrides",
	)) as Partial<Settings> | undefined;

	return overrides ?? {};
};

const getDefaultTragicDeaths = () => {
	return defaultTragicDeaths;
};

const getDiamondInfo = async (pid: number) => {
	let p;
	if (local.exhibitionGamePlayers) {
		p = local.exhibitionGamePlayers[pid];
	} else {
		p = await idb.cache.players.get(pid);
	}

	if (p) {
		return {
			name: `${p.firstName} ${p.lastName}`,
			spd: p.ratings.at(-1)!.spd,
		};
	}
};

const getJerseyNumberConflict = async ({
	pid,
	tid,
	jerseyNumber,
}: {
	pid: number | undefined;
	tid: number;
	jerseyNumber: string;
}) => {
	const conflicts = (
		await idb.cache.players.indexGetAll("playersByTid", tid)
	).filter((p) => {
		// Can't conflict with self
		if (p.pid === pid) {
			return false;
		}

		return helpers.getJerseyNumber(p) === jerseyNumber;
	});

	if (conflicts.length === 0) {
		const t = await idb.cache.teams.get(tid);
		if (t?.retiredJerseyNumbers) {
			for (const row of t.retiredJerseyNumbers) {
				if (row.number === jerseyNumber) {
					return {
						type: "retiredJerseyNumber" as const,
					};
				}
			}
		}

		// No player or retired jersey conflicts
		return;
	}

	if (conflicts.length === 1) {
		const p = conflicts[0]!;

		return {
			type: "player" as const,
			name: `${p.firstName} ${p.lastName}`,
			pid: p.pid,
		};
	}

	return {
		type: "multiple" as const,
	};
};

const getLeagueInfo = async (
	options: Parameters<typeof realRosters.getLeagueInfo>[0],
) => {
	return realRosters.getLeagueInfo(options);
};

const getLeagueName = () => {
	return league.getName();
};

const getLeagues = async () => {
	return idb.meta.getAll("leagues");
};

const getPlayerGraphStat = ({
	prev,
}: {
	prev?: { statType?: string; stat?: string };
}) => {
	const statType = prev?.statType ?? random.choice(statTypes);
	const stats = getStats(statType);
	const stat =
		prev?.stat !== undefined && stats.includes(prev.stat)
			? prev.stat
			: random.choice(stats);
	return {
		statType,
		stat,
	};
};

const getTeamGraphStat = ({
	prev,
	seasons,
}: {
	prev?: { statType?: string; stat?: string };
	seasons: [number, number];
}) => {
	const statType = prev?.statType ?? random.choice(teamStatTypes);
	const stats = teamGetStats(statType, seasons);

	const prevStat = prev?.stat;

	// opp logic is so switching between normal and opponent stats keeps the same stat selected (like pts and oppPts)
	let stat;
	if (prevStat !== undefined) {
		if (stats.includes(prevStat)) {
			stat = prevStat;
		} else if (prevStat.startsWith("opp")) {
			// Try removing opp
			const withoutOpp = prevStat.replace("opp", "");
			const withoutOppLower = `${withoutOpp.charAt(0).toLowerCase()}${withoutOpp.slice(1)}`;
			if (stats.includes(withoutOppLower)) {
				stat = withoutOppLower;
			}
		} else {
			// Try adding opp
			const withOpp = `opp${helpers.upperCaseFirstLetter(prevStat)}`;
			if (stats.includes(withOpp)) {
				stat = withOpp;
			}
		}
	}
	if (stat === undefined) {
		stat = random.choice(stats);
	}

	return {
		statType,
		stat,
	};
};

const getPlayersCommandPalette = async () => {
	const playersAll = await idb.cache.players.indexGetAll("playersByTid", [
		PLAYER.FREE_AGENT,
		Infinity,
	]);

	return idb.getCopies.playersPlus(playersAll, {
		attrs: ["pid", "firstName", "lastName", "abbrev", "age"],
		ratings: ["pos", "ovr", "pot"],
		season: g.get("season"),
		showNoStats: true,
		showRookies: true,
		fuzz: true,
	});
};

const getLocal = async (name: keyof Local) => {
	return local[name];
};

const getPlayerBioInfoDefaults = initDefaults;

const getPlayerRangeFooterStats = async ({
	pid,
	seasonRange,
}: {
	pid: number;
	seasonRange: [number, number];
}) => {
	const pRaw = await idb.getCopy.players(
		{
			pid,
		},
		"noCopyCache",
	);
	if (!pRaw) {
		return;
	}

	const p = await getPlayer(pRaw, seasonRange);

	if (p) {
		// Would be nice to only return the one we need, but returning them all means tab changes are free
		return {
			careerStatsCombined: p.careerStatsCombined,
			careerStatsPlayoffs: p.careerStatsPlayoffs,
			careerStats: p.careerStats,
		};
	}
};

const getPlayerWatch = async (pid: number) => {
	if (Number.isNaN(pid)) {
		return 0;
	}

	let p;
	if (local.exhibitionGamePlayers) {
		p = local.exhibitionGamePlayers[pid];
		if (!p) {
			return 0;
		}
	} else {
		p = await idb.cache.players.get(pid);
	}

	if (p) {
		return p.watch ?? 0;
	}
	const p2 = await idb.getCopy.players({ pid }, "noCopyCache");
	if (p2) {
		return p2.watch ?? 0;
	}

	return 0;
};

const getProjectedAttendance = async ({
	ticketPrice,
	tid,
}: {
	ticketPrice: number;
	tid: number;
}) => {
	if (Number.isNaN(ticketPrice)) {
		return 0;
	}

	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsByTidSeason",
		[
			[tid, g.get("season") - 2],
			[tid, g.get("season")],
		],
	);
	const teamSeason = teamSeasons.at(-1);
	if (!teamSeason) {
		return 0;
	}

	const baseAttendance = getBaseAttendance({
		hype: teamSeason.hype,
		pop: teamSeason.pop,
		playoffs: false,
	});
	const adjustedTicketPrice = getAdjustedTicketPrice(ticketPrice, false);
	const attendance = await getActualAttendance({
		baseAttendance,
		randomize: false,
		stadiumCapacity: teamSeason.stadiumCapacity,
		teamSeasons,
		tid: teamSeason.tid,
		adjustedTicketPrice,
	});

	return attendance;
};

const getRandomCollege = async () => {
	// Don't use real country, since most have no colleges by default
	const { college } = await player.name("None");
	return college;
};

const getRandomCountry = async () => {
	const playerBioInfo = local.playerBioInfo ?? (await loadNames());

	// Equal odds of every country, otherwise it's too commonly USA - no fun!
	return withState(random.choice(playerBioInfo.frequencies)[0]);
};

const getRandomInjury = () => {
	return player.injury(DEFAULT_LEVEL);
};

const getRandomJerseyNumber = async ({
	pid,
	pos,
	tid,
}: {
	pid: number | undefined;
	pos: string;
	tid: number;
}) => {
	const jerseyNumber = await player.genJerseyNumber(
		{
			pid,
			tid,
			ratings: [
				{
					pos,
				},
			],
			stats: [],
		},
		undefined,
		undefined,
		true,
	);

	return jerseyNumber;
};

const getRandomName = async (country: string) => {
	const { firstName, lastName } = await player.name(
		helpers.getCountry(country),
	);
	return { firstName, lastName };
};

const getRandomRatings = async ({
	age,
	pos,
}: {
	age: number;
	pos: string | undefined;
}) => {
	// 100 tries to find a matching position
	let p: any;
	for (let i = 0; i < 100; i++) {
		p = player.generate(
			PLAYER.UNDRAFTED,
			19,
			g.get("season"),
			false,
			g.get("numActiveTeams") / 2,
		);
		if (p.ratings[0].pos === pos || pos === undefined) {
			break;
		}
	}

	await player.develop(p, age - 19);

	const ratings: Record<string, unknown> = {};
	for (const key of RATINGS) {
		ratings[key] = (p.ratings[0] as any)[key];
	}
	if (pos === undefined) {
		ratings.pos = p.ratings[0].pos;
	}
	return {
		hgt: p.hgt,
		ratings,
	};
};

const getOffers = async (
	userPids: number[],
	userDpids: number[],
	lookingFor: LookingFor,
) => {
	const teams = await idb.cache.teams.getAll();
	const tids = orderBy(
		teams.filter((t) => !t.disabled),
		["region", "name", "tid"],
	).map((t) => t.tid);
	const offers = [];

	for (const tid of tids) {
		const teams: TradeTeams = [
			{
				tid: g.get("userTid"),
				pids: userPids,
				pidsExcluded: [],
				dpids: userDpids,
				dpidsExcluded: [],
			},
			{
				tid,
				pids: [],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
		];

		if (tid !== g.get("userTid")) {
			const teams2 = await trade.makeItWork(teams, {
				holdUserConstant: true,
				maxAssetsToAdd: 4 + userPids.length + userDpids.length,
				lookingFor,
			});

			if (teams2) {
				offers.push(teams2);
			}
		}
	}

	return offers;
};

export const augmentOffers = async (offers: TradeTeams[]) => {
	if (offers.length === 0) {
		return [];
	}

	const teams = await idb.getCopies.teamsPlus({
		attrs: ["abbrev", "region", "name", "strategy", "tid"],
		seasonAttrs: ["won", "lost", "tied", "otl"],
		season: g.get("season"),
		addDummySeason: true,
	});
	const teamsByTid = groupByUnique(teams, "tid");
	const stats = bySport({
		baseball: ["gp", "keyStats", "war"],
		basketball: ["gp", "min", "pts", "trb", "ast", "per"],
		football: ["gp", "keyStats", "av"],
		hockey: ["gp", "keyStats", "ops", "dps", "ps"],
	});

	// Take the pids and dpids in each offer and get the info needed to display the offer
	return Promise.all(
		offers.map(async (offerRaw) => {
			const tid = offerRaw[1].tid;
			const t = teamsByTid[tid];
			if (!t) {
				throw new Error("No team found");
			}

			const formatPicks = async (tid: number, dpids: number[]) => {
				let picks = await idb.getCopies.draftPicks(
					{
						tid,
					},
					"noCopyCache",
				);
				picks = picks.filter((dp) => dpids.includes(dp.dpid));

				return await Promise.all(
					picks.map(async (dp) => {
						return {
							...dp,
							desc: await helpers.pickDesc(dp, "short"),
						};
					}),
				);
			};

			const formatPlayers = async (tid: number, pids: number[]) => {
				let playersAll = await idb.cache.players.indexGetAll(
					"playersByTid",
					tid,
				);
				playersAll = playersAll.filter(
					(p) => pids.includes(p.pid) && !isUntradable(p).untradable,
				);
				return addFirstNameShort(
					await idb.getCopies.playersPlus(playersAll, {
						attrs: [
							"pid",
							"firstName",
							"lastName",
							"age",
							"contract",
							"injury",
							"jerseyNumber",
							"draft",
						],
						ratings: ["ovr", "pot", "skills", "pos"],
						stats,
						season: g.get("season"),
						tid,
						showNoStats: true,
						showRookies: true,
						fuzz: true,
					}),
				);
			};

			const payroll = await team.getPayroll(tid);
			return {
				tid,
				strategy: t.strategy,
				won: t.seasonAttrs.won,
				lost: t.seasonAttrs.lost,
				tied: t.seasonAttrs.tied,
				otl: t.seasonAttrs.otl,
				pids: offerRaw[1].pids,
				dpids: offerRaw[1].dpids,
				pidsUser: offerRaw[0].pids,
				dpidsUser: offerRaw[0].dpids,
				payroll,
				picks: await formatPicks(tid, offerRaw[1].dpids),
				players: await formatPlayers(tid, offerRaw[1].pids),
				picksUser: await formatPicks(g.get("userTid"), offerRaw[0].dpids),
				playersUser: await formatPlayers(g.get("userTid"), offerRaw[0].pids),
				summary: await getSummary(offerRaw),
			};
		}),
	);
};

const toConciseLookingFor = (lookingForState: LookingForState) => {
	const output = {
		positions: new Set<string>(),
		skills: new Set<string>(),
		draftPicks: lookingForState.assets.draftPicks!,
		prospects: lookingForState.assets.prospects!,
		bestCurrentPlayers: lookingForState.assets.bestCurrentPlayers!,
	};

	for (const category of ["positions", "skills"] as const) {
		for (const [key, value] of Object.entries(lookingForState[category])) {
			if (value) {
				output[category].add(key);
			}
		}
	}

	return output;
};

const getTradingBlockOffers = async ({
	pids,
	dpids,
	lookingFor,
}: {
	pids: number[];
	dpids: number[];
	lookingFor: LookingForState;
}) => {
	let offers = await getOffers(pids, dpids, toConciseLookingFor(lookingFor));

	let saveLookingFor;
	let positionAndNotDraftPicks = false;
	let draftPicksAndNothingElse = lookingFor.assets.draftPicks;
	for (const type of helpers.keys(lookingFor)) {
		const obj = lookingFor[type];
		for (const [key, value] of Object.entries(obj)) {
			if (value) {
				saveLookingFor = true;

				if (!lookingFor.assets.draftPicks && type === "positions") {
					positionAndNotDraftPicks = true;
				}

				if (
					draftPicksAndNothingElse &&
					(type !== "assets" || key !== "draftPicks")
				) {
					draftPicksAndNothingElse = false;
				}
			}
		}
	}

	// If we're looking for a position and not draft picks, only keep offers that include that position
	if (positionAndNotDraftPicks) {
		offers = offers.filter((offer) => {
			return offer[1].pids.length > 0;
		});
	}

	// If we're looking for draft picks and nothing else, only keep offers that include picks
	if (draftPicksAndNothingElse) {
		offers = offers.filter((offer) => {
			return offer[1].dpids.length > 0;
		});
	}

	const savedTradingBlock = {
		rid: 0 as const,
		dpids,
		pids,
		tid: g.get("userTid"),
		offers: offers.map((offer) => {
			return {
				dpids: offer[1].dpids,
				pids: offer[1].pids,
				tid: offer[1].tid,
			};
		}),
		lookingFor: saveLookingFor ? lookingFor : undefined,
	};
	await idb.cache.savedTradingBlock.put(savedTradingBlock);

	return augmentOffers(offers);
};

const ping = async () => {
	return;
};

const handleUploadedDraftClass = async ({
	uploadedFile,
	draftYear,
}: {
	uploadedFile: any;
	draftYear: number;
}) => {
	// Find season from uploaded file, for age adjusting
	let uploadedSeason: number | undefined;

	if (uploadedFile.gameAttributes) {
		if (Array.isArray(uploadedFile.gameAttributes)) {
			uploadedFile.gameAttributes = gameAttributesArrayToObject(
				uploadedFile.gameAttributes,
			);
		}

		if (uploadedFile.gameAttributes.season !== undefined) {
			uploadedSeason = uploadedFile.gameAttributes.season;
		}
	}

	if (Object.hasOwn(uploadedFile, "startingSeason")) {
		uploadedSeason = uploadedFile.startingSeason;
	}

	// Get all players from uploaded files
	let players: any[] = uploadedFile.players;

	// Filter out any that are not draft prospects
	players = players.filter((p) => p.tid === PLAYER.UNDRAFTED);

	// Handle draft format change in version 33, where PLAYER.UNDRAFTED has multiple draft classes
	if (uploadedFile.version !== undefined && uploadedFile.version >= 33) {
		let filtered = players.filter(
			(p) =>
				p.draft === undefined ||
				p.draft.year === undefined ||
				p.draft.year === "" ||
				p.draft.year === uploadedSeason,
		);

		if (filtered.length === 0) {
			// Try the next season, in case draft already happened
			filtered = players.filter(
				(p) =>
					uploadedSeason !== undefined && p.draft.year === uploadedSeason + 1,
			);
		}

		players = filtered;
	}

	// Get scouting rank, which is used in a couple places below
	const scoutingLevel = await finances.getLevelLastThree("scouting", {
		tid: g.get("userTid"),
	});

	// Delete old players from draft class
	const oldPlayers = await idb.cache.players.indexGetAll(
		"playersByDraftYearRetiredYear",
		[[draftYear], [draftYear, Infinity]],
	);

	const toRemove = [];
	for (const p of oldPlayers) {
		if (p.tid === PLAYER.UNDRAFTED) {
			toRemove.push(p.pid);
		}
	}
	await player.remove(toRemove);

	// Add new players to database
	for (const p of players) {
		// Adjust age and seasons
		p.ratings[0].season = draftYear;

		const noDraftProperty = !p.draft;
		if (noDraftProperty) {
			// For college basketball imports
			p.draft = {
				round: 0,
				pick: 0,
				tid: -1,
				originalTid: -1,
				year: draftYear,
				pot: 0,
				ovr: 0,
				skills: [],
			};
		}

		if (uploadedSeason !== undefined) {
			p.born.year = draftYear - (uploadedSeason - p.born.year);
		} else if (noDraftProperty) {
			// Hopefully never happens
			p.born.year = draftYear - 19;
		}

		// Would be nice to allow keeping it, but it's kind of messy to duplicate the logic here and in importPlayers and to add a UI
		delete p.stats;

		// Make sure player object is fully defined
		const p2 = await player.augmentPartialPlayer(
			p,
			scoutingLevel,
			uploadedFile.version,
		);
		p2.draft.year = draftYear;
		p2.ratings.at(-1)!.season = draftYear;
		p2.tid = PLAYER.UNDRAFTED;

		if (Object.hasOwn(p2, "pid")) {
			// @ts-expect-error
			delete p2.pid;
		}

		await player.updateValues(p2);

		await idb.cache.players.add(p2);
	}

	// "Top off" the draft class if not enough players imported
	await draft.genPlayers(draftYear, scoutingLevel);

	await toUI("realtimeUpdate", [["playerMovement"]]);
};

const idbCacheFlush = async () => {
	await idb.cache.flush();
};

const importPlayers = async ({
	includeStats,
	leagueFileVersion,
	players,
}: {
	includeStats: boolean;
	leagueFileVersion: number | undefined;
	players: {
		p: any;
		contractAmount: string;
		contractExp: string;
		draftYear: string;
		season: number;
		seasonOffset: number;
		tid: number;
	}[];
}) => {
	const currentSeason = g.get("season");
	const currentPhase = g.get("phase");

	for (const {
		p,
		contractAmount,
		contractExp,
		draftYear,
		season,
		seasonOffset,
		tid,
	} of players) {
		const stats = (p.stats && includeStats ? p.stats : []) as any[];
		for (const row of stats) {
			// Not worth trying to match up tids - even with srID it's not the same league so those aren't actually the same teams
			row.tid = PLAYER.DOES_NOT_EXIST;
		}

		const p2 = {
			born: p.born,
			college: p.college,
			contract: {
				amount: helpers.localeParseFloat(contractAmount) * 1000,
				exp: Number.parseInt(contractExp),
			},
			draft: {
				...p.draft,
				round: 0,
				pick: 0,
				tid: -1,
				originalTid: -1,
			},
			face: p.face,
			firstName: p.firstName,
			hgt: p.hgt,
			imgURL: p.imgURL,
			injuries: p.injuries ?? [],
			lastName: p.lastName,
			ratings: p.ratings,
			salaries: p.salaries ?? [],
			srID: p.srID,
			stats,
			tid,
			transactions: [
				{
					season: currentSeason,
					phase: currentPhase,
					tid,
					type: "import",
				},
			],
			weight: p.weight,

			// Particularly important because stats are ignored, so jersey number is lost without this
			jerseyNumber: p.stats?.at(-1)?.jerseyNumber ?? p.jerseyNumber,
		};

		if (p.customMoodItems) {
			(p2 as any).customMoodItems = p.customMoodItems;
		}
		if (p.noteBool) {
			(p2 as any).note = p.note;
			(p2 as any).noteBool = p.noteBool;
		}
		if (p.real) {
			(p2 as any).real = p.real;
		}

		// Only add injury if the season wasn't chaned by the user. These variables copied from ImportPlayers init
		const exportedSeason: number | undefined =
			typeof p.exportedSeason === "number" ? p.exportedSeason : undefined;
		const season2 =
			(exportedSeason !== undefined
				? p.exportedSeason
				: p.ratings.at(-1).season) + seasonOffset;
		if (season === season2) {
			(p2 as any).injury = p.injury;
		}

		const adjustAndFilter = (
			key: "injuries" | "ratings" | "salaries" | "stats",
			seasonOffset: number,
			draftProspect: boolean,
		) => {
			for (const row of p2[key]) {
				row.season += seasonOffset;
			}

			let offset = 0;
			if (!draftProspect) {
				if (key === "injuries" && currentPhase < PHASE.REGULAR_SEASON) {
					// No injuries from current season, if current season has not started yet
					offset = -1;
				} else if (key === "salaries") {
					// Current season salary will be added later
					offset = -1;
				} else if (key === "stats" && currentPhase <= PHASE.PLAYOFFS) {
					// Don't include current season stats if the season has not started yet. Might be good to separate playoff stats and non-playoff stats and use differnet phase cutoffs, but whatever.
					offset = -1;
				}
			}

			p2[key] = p2[key].filter(
				(row: any) => row.season <= currentSeason + offset,
			);
		};

		if (tid === PLAYER.UNDRAFTED) {
			const draftYearInt = Number.parseInt(draftYear);
			if (
				Number.isNaN(draftYearInt) ||
				draftYearInt < currentSeason ||
				(currentPhase > PHASE.DRAFT && draftYearInt === currentSeason)
			) {
				throw new Error("Invalid draft year");
			}

			const ratingsSeason = season - seasonOffset;
			const ageAtDraft = ratingsSeason - p2.born.year;

			p2.draft.year = draftYearInt;
			p2.born.year = draftYearInt - ageAtDraft;

			const ratings = p2.ratings.find(
				(row: any) => row.season === ratingsSeason,
			);
			if (!ratings) {
				throw new Error(
					`Ratings not found for player ${p.pid} in season ${ratingsSeason}`,
				);
			}

			p2.salaries = [];
			p2.injuries = [];
			p2.ratings = [ratings];
			adjustAndFilter("stats", currentSeason - ratingsSeason, true);
			ratings.season = p2.draft.year;
		} else {
			// How many seasons to adjust player to bring him aligned with current season, as an active player at the selected age
			const seasonOffset2 = currentSeason - (season - seasonOffset);

			p2.born.year += seasonOffset2;
			p2.draft.year += seasonOffset2;

			adjustAndFilter("injuries", seasonOffset2, false);
			adjustAndFilter("ratings", seasonOffset2, false);
			adjustAndFilter("salaries", seasonOffset2, false);
			adjustAndFilter("stats", seasonOffset2, false);

			player.setContract(p2, p2.contract, tid >= 0);
		}

		const p3 = await player.augmentPartialPlayer(
			p2,
			DEFAULT_LEVEL,
			leagueFileVersion,
		);
		await player.updateValues(p3);

		await idb.cache.players.put(p3);
	}

	await toUI("realtimeUpdate", [["playerMovement"]]);
};

const importPlayersGetReal = async () => {
	const basketball = await loadData();
	const groupedRatings = Object.values(groupBy(basketball.ratings, "slug"));

	const formatPlayer = await formatPlayerFactory(
		basketball,
		{
			type: "real",
			season: REAL_PLAYERS_INFO!.MAX_SEASON,
			phase: g.get("phase"),
			randomDebuts: false,
			randomDebutsKeepCurrent: false,
			realDraftRatings: g.get("realDraftRatings") ?? "rookie",
			realStats: "all", // Maybe should default to "none" on mobile, but then I'd need a UI to change it, and most people probably want "all"  if they are using this feature
			includePlayers: true,
		},
		REAL_PLAYERS_INFO!.MAX_SEASON,
		[],
		-1,
	);

	const contract = {
		exp: g.get("season") + 2,
		amount: helpers.roundContract(
			Math.sqrt(g.get("minContract") * g.get("maxContract")),
		),
	};
	const salaries = range(g.get("season"), contract.exp + 1).map((season) => {
		return {
			season,
			amount: contract.amount,
		};
	});

	const realPlayerPhotos = (await (
		await idb.meta.transaction("attributes")
	).store.get("realPlayerPhotos")) as RealPlayerPhotos | undefined;

	const players = [];
	for (const ratings of groupedRatings) {
		const p = formatPlayer(ratings);
		applyRealPlayerPhotos(realPlayerPhotos, p);
		p.contract = { ...contract };
		p.salaries = helpers.deepCopy(salaries);

		const p2 = await player.augmentPartialPlayer(
			p,
			DEFAULT_LEVEL,
			LEAGUE_DATABASE_VERSION,
			true,
		);
		players.push(p2);
	}

	return players;
};

const incrementTradeProposalsSeed = async () => {
	await league.setGameAttributes({
		tradeProposalsSeed: g.get("tradeProposalsSeed") + 1,
	});

	await toUI("realtimeUpdate", [["g.tradeProposalsSeed"]]);
};

let initRan = false;
const init = async (inputEnv: Env, conditions: Conditions) => {
	Object.assign(env, inputEnv);

	// Kind of hacky, only run this for the first host tab
	if (!initRan) {
		initRan = true;
		checkNaNs();

		// Account and changes checks can be async
		(async () => {
			// Account check needs to complete before initAds, though
			await checkAccount(conditions);
			await toUI("initAds", ["accountChecked"], conditions);

			// This might make another HTTP request, and is less urgent than ads
			await checkChanges(conditions);
		})();
	} else {
		// No need to run checkAccount and make another HTTP request
		const currentTimestamp = Math.floor(Date.now() / 1000) - GRACE_PERIOD;
		await toUI("updateLocal", [
			{
				gold: local.goldUntil < Infinity && currentTimestamp <= local.goldUntil,
				email: local.email,
				username: local.username,
			},
		]);

		(async () => {
			await toUI("initAds", ["accountChecked"], conditions);
		})();
	}

	// Send options to all new tabs
	const options = ((await idb.meta.get("attributes", "options")) ??
		{}) as unknown as Options;
	await toUI(
		"updateLocal",
		[{ units: options.units, fullNames: options.fullNames }],
		conditions,
	);
};

const initGold = async () => {
	await toUI("initGold", []);
};

const loadRetiredPlayers = async () => {
	const players = await idb.cache.players.getAll();
	const playersByPid = groupByUnique(players, "pid");

	const playerNames: {
		pid: number;
		firstName: string;
		lastName: string;
		firstSeason: number;
		lastSeason: number;
	}[] = [];

	for await (const { value: pTemp } of idb.league.transaction("players")
		.store) {
		// Make sure we have latest version of this player
		const p = playersByPid[pTemp.pid] ?? pTemp;

		playerNames.push(formatPlayerRelativesList(p));
	}

	return finalizePlayersRelativesList(playerNames);
};

const lockSet = async ([name, value]: [LockName, boolean]) => {
	await lock.set(name, value);
};

const ovr = async ({
	ratings,
	pos,
}: {
	ratings: MinimalPlayerRatings;
	pos: string;
}) => {
	return player.ovr(ratings, pos);
};

const ratingsStatsPopoverInfo = async ({
	pid,
	season,
}: {
	pid: number;
	season?: number;
}) => {
	const blankObj = {
		name: undefined,
		ratings: undefined,
		stats: undefined,
	};

	if (Number.isNaN(pid) || typeof pid !== "number") {
		return blankObj;
	}

	let p;
	if (local.exhibitionGamePlayers) {
		p = local.exhibitionGamePlayers[pid];
	} else if (local.liveSimRatingsStatsPopoverPlayers) {
		p = local.liveSimRatingsStatsPopoverPlayers[pid];
	}

	if (!p) {
		p = await idb.getCopy.players(
			{
				pid,
			},
			"noCopyCache",
		);
	}

	if (!p) {
		return blankObj;
	}

	const currentSeason = g.get("season");

	let actualSeason: number | undefined;
	let draftProspect = false;
	if (local.exhibitionGamePlayers && p.stats.length > 0) {
		actualSeason = p.stats.at(-1)!.season;
	} else {
		if (season !== undefined) {
			// For draft prospects, show their draft season, otherwise they will be skipped due to not having ratings in g.get("season")
			actualSeason = p.draft.year > season ? p.draft.year : season;
		} else {
			actualSeason =
				p.draft.year > currentSeason ? p.draft.year : currentSeason;
		}

		// If player has no stats that season and is not a draft prospect, show career stats
		if (
			p.draft.year < actualSeason &&
			!p.ratings.some((row) => row.season === actualSeason)
		) {
			actualSeason = undefined;
		}

		if (p.draft.year === actualSeason) {
			draftProspect = true;
			actualSeason = undefined;
		}
	}

	const stats = bySport({
		baseball: ["keyStats"],
		basketball: [
			"pts",
			"trb",
			"ast",
			"blk",
			"stl",
			"tov",
			"min",
			"per",
			"ewa",
			"tsp",
			"tpar",
			"ftr",
			"fgp",
			"tpp",
			"ftp",
		],
		football: ["keyStats"],
		hockey: ["keyStatsWithGoalieGP"],
	});

	const attrs = ["name", "jerseyNumber", "tid", "age", "note"];
	const ratings = ["pos", "ovr", "pot", "season", "tid", ...RATINGS];
	if (!local.exhibitionGamePlayers) {
		attrs.push("abbrev");
		ratings.push("abbrev");
	}

	const p2 = await idb.getCopy.playersPlus(p, {
		attrs,
		ratings,
		stats: ["tid", "season", "playoffs", ...stats],
		season: actualSeason,
		showNoStats: true,
		showRetired: true,
		oldStats: true,
		fuzz: true,
	});
	if (actualSeason === undefined) {
		if (draftProspect) {
			p2.ratings = p2.ratings[0];
		} else {
			// Peak ratings
			p2.ratings = maxBy(p.ratings, "ovr");
		}
		p2.age = p2.ratings.season - p.born.year;

		p2.stats = p2.careerStats;
		delete p2.careerStats;
	}
	if (actualSeason === undefined || actualSeason < currentSeason) {
		p2.abbrev = p2.ratings.abbrev;
		p2.tid = p2.ratings.tid;
	}
	delete p2.ratings.abbrev;
	delete p2.ratings.tid;
	delete p2.stats.playoffs;
	delete p2.stats.season;
	delete p2.stats.tid;

	let type: "career" | "current" | "draft" | number;
	if (draftProspect) {
		type = "draft";
	} else if (actualSeason === undefined) {
		type = "career";
	} else if (actualSeason >= currentSeason) {
		type = "current";
	} else {
		type = actualSeason;
	}
	return {
		...p2,
		type,
	};
};

// Why does this exist, just to send it back to the UI? So an action in one tab will trigger and update in all tabs! Never pass a URL here because it would apply to all tabs.
const realtimeUpdate = async (updateEvents: UpdateEvents) => {
	await toUI("realtimeUpdate", [updateEvents]);
};

const regenerateDraftClass = async (season: number, conditions: Conditions) => {
	const proceed = await toUI(
		"confirm",
		[
			"This will delete the existing draft class and replace it with a new one filled with randomly generated players. Are you sure you want to do that?",
			{
				okText: "Regenerate Draft Class",
			},
		],
		conditions,
	);

	if (proceed) {
		// Delete old players from draft class
		const oldPlayers = await idb.cache.players.indexGetAll(
			"playersByDraftYearRetiredYear",
			[[season], [season, Infinity]],
		);

		const toRemove = [];
		for (const p of oldPlayers) {
			if (p.tid === PLAYER.UNDRAFTED) {
				toRemove.push(p.pid);
			}
		}
		await player.remove(toRemove);

		// Generate new players
		await draft.genPlayers(season);
		await toUI("realtimeUpdate", [["playerMovement"]]);
	}
};

const regenerateSchedule = async (param: unknown, conditions: Conditions) => {
	const teams = await idb.getCopies.teamsPlus(
		{
			attrs: ["tid"],
			seasonAttrs: ["cid", "did", "abbrev"],
			season: g.get("season"),
			active: true,
		},
		"noCopyCache",
	);

	const tids = await season.newSchedule(teams, conditions);

	const schedule = season.addDaysToSchedule(
		tids.map(([homeTid, awayTid]) => ({
			homeTid,
			awayTid,
		})),
	);

	return formatScheduleForEditor(schedule, teams, []);
};

const releasePlayer = async ({ pids }: { pids: number[] }) => {
	if (pids.length === 0) {
		return;
	}

	const players = await idb.getCopies.players({ pids });
	if (players.length !== pids.length) {
		return "Player not found";
	}

	if (players.some((p) => p.tid !== g.get("userTid"))) {
		return "You aren't allowed to do this";
	}

	for (const p of players) {
		const justDrafted = helpers.justDrafted(p, g.get("phase"), g.get("season"));

		await player.release(p, justDrafted);
	}

	await toUI("realtimeUpdate", [["playerMovement"]]);
	await recomputeLocalUITeamOvrs();

	// Purposely after realtimeUpdate, so the UI update happens without waiting for this to complete
	await freeAgents.normalizeContractDemands({
		type: "dummyExpiringContracts",
		pids,
	});
};

const expandVote = (
	params: { override: boolean; userVote: boolean },
	conditions: Conditions,
) => {
	return team.expandVote(params, conditions);
};

const relocateVote = (params: {
	override: boolean;
	realign: boolean;
	rebrandTeam: boolean;
	userVote: boolean;
}) => {
	return team.relocateVote(params);
};

const removeLastTeam = async () => {
	const tid = g.get("numTeams") - 1;
	const players = await idb.cache.players.indexGetAll("playersByTid", tid);

	for (const p of players) {
		player.addToFreeAgents(p);
		await idb.cache.players.put(p);
	}

	// Delete draft picks, and return traded ones to original owner
	await draft.genPicks();

	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsByTidSeason",
		[[tid], [tid, "Z"]],
	);

	for (const teamSeason of teamSeasons) {
		await idb.cache.teamSeasons.delete(teamSeason.rid);
	}

	const teamStats = [
		...(await idb.cache.teamStats.indexGetAll("teamStatsByPlayoffsTid", [
			[false, tid],
			[false, tid],
		])),
		...(await idb.cache.teamStats.indexGetAll("teamStatsByPlayoffsTid", [
			[true, tid],
			[true, tid],
		])),
	];

	for (const teamStat of teamStats) {
		await idb.cache.teamStats.delete(teamStat.rid);
	}

	await idb.cache.teams.delete(tid);
	const updatedGameAttributes: any = {
		numActiveTeams: g.get("numActiveTeams") - 1,
		numTeams: g.get("numTeams") - 1,
		teamInfoCache: g.get("teamInfoCache").slice(0, -1),
		userTids: g.get("userTids").filter((userTid) => userTid !== tid),
	};

	if (g.get("userTid") === tid && tid > 0) {
		updatedGameAttributes.userTid = tid - 1;

		if (!updatedGameAttributes.userTids.includes(tid - 1)) {
			updatedGameAttributes.userTids.push(tid - 1);
		}
	}

	await league.setGameAttributes(updatedGameAttributes);

	// Manually removing a new team can mess with scheduled events, because they are indexed on tid. Let's try to adjust them.
	// Delete future scheduledEvents for the deleted team, and decrement future tids for new teams
	const scheduledEvents = await idb.getCopies.scheduledEvents(
		undefined,
		"noCopyCache",
	);
	for (const scheduledEvent of scheduledEvents) {
		if (scheduledEvent.season < g.get("season")) {
			await idb.cache.scheduledEvents.delete(scheduledEvent.id);
		} else if (scheduledEvent.type === "expansionDraft") {
			let updated;
			let hasTid;
			for (const t2 of scheduledEvent.info.teams) {
				if (typeof t2.tid === "number" && tid < t2.tid) {
					t2.tid -= 1;
					updated = true;
				} else if (typeof t2.tid === "number" && tid === t2.tid) {
					hasTid = true;
				}
			}

			if (hasTid) {
				scheduledEvent.info.teams = scheduledEvent.info.teams.filter(
					(t2) => t2.tid !== tid,
				);
				updated = true;
			}

			if (updated) {
				await idb.cache.scheduledEvents.put(scheduledEvent);
			}
		} else if (
			scheduledEvent.type == "contraction" ||
			scheduledEvent.type === "teamInfo"
		) {
			if (tid === scheduledEvent.info.tid) {
				await idb.cache.scheduledEvents.delete(scheduledEvent.id);
			} else if (tid < scheduledEvent.info.tid) {
				scheduledEvent.info.tid -= 1;
				await idb.cache.scheduledEvents.put(scheduledEvent);
			}
		}
	}

	await idb.cache.flush();
};

const cloneLeague = async (lid: number) => {
	const name = await league.clone(lid);
	await toUI("realtimeUpdate", [["leagues"]]);
	return name;
};

const removeLeague = async (lid: number) => {
	await league.remove(lid);
	await toUI("realtimeUpdate", [["leagues"]]);
};

const removePlayers = async (pids: number[]) => {
	await player.remove(pids);
	await toUI("realtimeUpdate", [["playerMovement"]]);
};

const reorderDepthDrag = async ({
	pos,
	sortedPids,
}: {
	pos: string;
	sortedPids: number[];
}) => {
	const t = await idb.cache.teams.get(g.get("userTid"));
	if (!t) {
		throw new Error("Invalid tid");
	}
	const depth = t.depth;

	if (depth === undefined) {
		throw new Error("Missing depth");
	}

	if (Object.hasOwn(depth, pos)) {
		t.keepRosterSorted = false;

		// https://github.com/microsoft/TypeScript/issues/21732
		// @ts-expect-error
		depth[pos] = sortedPids;
		await idb.cache.teams.put(t);
		await toUI("realtimeUpdate", [["playerMovement"]]);
	}
};

const reorderDraftDrag = async (sortedDpids: number[]) => {
	const draftPicks = await draft.getOrder();
	for (const dp of draftPicks) {
		const sortedIndex = sortedDpids.indexOf(dp.dpid);
		const dpToTakeOrderFrom = draftPicks[sortedIndex];
		if (!dpToTakeOrderFrom) {
			throw new Error("Invalid dpid");
		}

		// Only need to update database if something changed
		if (dpToTakeOrderFrom.dpid !== dp.dpid) {
			await idb.cache.draftPicks.put({
				...dp,
				round: dpToTakeOrderFrom.round,
				pick: dpToTakeOrderFrom.pick,
			});
		}
	}

	await toUI("realtimeUpdate", [["playerMovement"]]);
};

const reorderRosterDrag = async (sortedPids: number[]) => {
	for (const [rosterOrder, pid] of sortedPids.entries()) {
		const p = await idb.cache.players.get(pid);
		if (!p) {
			throw new Error("Invalid pid");
		}

		if (p.rosterOrder !== rosterOrder) {
			p.rosterOrder = rosterOrder;
			await idb.cache.players.put(p);
		}
	}

	const t = await idb.cache.teams.get(g.get("userTid"));
	if (t) {
		t.keepRosterSorted = false;
		await idb.cache.teams.put(t);
	}

	await toUI("realtimeUpdate", [["gameAttributes", "playerMovement"]]);
};

const resetPlayingTime = async (tids: number[] | undefined) => {
	const tids2 = tids ?? [g.get("userTid")];

	const players = await idb.cache.players.indexGetAll("playersByTid", [
		0,
		Infinity,
	]);

	for (const p of players) {
		if (tids2.includes(p.tid)) {
			p.ptModifier = 1;
			await idb.cache.players.put(p);
		}
	}

	await toUI("realtimeUpdate", [["playerMovement"]]);
};

const retiredJerseyNumberDelete = async ({
	tid,
	i,
}: {
	tid: number;
	i: number;
}) => {
	const t = await idb.cache.teams.get(tid);
	if (!t) {
		throw new Error("Invalid tid");
	}

	if (t.retiredJerseyNumbers) {
		t.retiredJerseyNumbers = t.retiredJerseyNumbers.filter((row, j) => i !== j);
		await idb.cache.teams.put(t);
		await toUI("realtimeUpdate", [["retiredJerseys", "playerMovement"]]);
	}
};

const retiredJerseyNumberUpsert = async ({
	tid,
	i,
	info,
}: {
	tid: number;
	i?: number;
	info: {
		number: string;
		seasonRetired: number;
		seasonTeamInfo: number;
		pid: number | undefined;
		text: string;
	};
}) => {
	const t = await idb.cache.teams.get(tid);
	if (!t) {
		throw new Error("Invalid tid");
	}

	if (Number.isNaN(info.seasonRetired)) {
		throw new Error("Invalid value for seasonRetired");
	}
	if (Number.isNaN(info.seasonTeamInfo)) {
		throw new Error("Invalid value for seasonTeamInfo");
	}
	if (Number.isNaN(info.pid)) {
		throw new Error("Invalid value for player ID number");
	}

	let playerText = "";
	let score: number | undefined;
	if (info.pid !== undefined) {
		const p = await idb.getCopy.players({ pid: info.pid }, "noCopyCache");
		if (p) {
			playerText = `<a href="${helpers.leagueUrl(["player", p.pid])}">${
				p.firstName
			} ${p.lastName}</a>'s `;

			score = getScore(p, tid);
		}
	}

	// Insert or update?
	let saveEvent = false;
	if (i === undefined) {
		saveEvent = true;

		if (!t.retiredJerseyNumbers) {
			t.retiredJerseyNumbers = [];
		}

		t.retiredJerseyNumbers.push({
			...info,
			score,
		});
	} else {
		if (!t.retiredJerseyNumbers) {
			throw new Error("Cannot edit when retiredJerseyNumbers is undefined");
		}

		if (i >= t.retiredJerseyNumbers.length) {
			throw new Error("Invalid index");
		}

		const prevNumber = t.retiredJerseyNumbers[i]?.number;
		if (prevNumber !== info.number) {
			saveEvent = true;
		}

		t.retiredJerseyNumbers[i] = {
			...info,
			score,
		};
	}

	if (saveEvent) {
		logEvent({
			type: "retiredJersey",
			text: `The ${t.region} ${t.name} retired ${playerText}#${info.number}.`,
			showNotification: false,
			pids: info.pid ? [info.pid] : [],
			tids: [t.tid],
			score: 20,
		});
	}

	await idb.cache.teams.put(t);

	// Handle players who have the retired jersey number
	if (actualPhase() <= PHASE.PLAYOFFS) {
		const players = await idb.cache.players.indexGetAll("playersByTid", tid);
		for (const p of players) {
			if (p.stats.length === 0) {
				continue;
			}

			const jerseyNumber = helpers.getJerseyNumber(p);
			if (jerseyNumber === info.number) {
				player.setJerseyNumber(p, await player.genJerseyNumber(p));
				await idb.cache.players.put(p);
			}
		}
	}

	await toUI("realtimeUpdate", [["retiredJerseys", "playerMovement"]]);
};

const runBefore = async (
	{
		viewId,
		params,
		ctxBBGM,
		updateEvents,
		prevData,
	}: {
		viewId: string;
		params: any;
		ctxBBGM: any;
		updateEvents: UpdateEvents;
		prevData: any;
	},
	conditions: Conditions,
): Promise<void | {
	[key: string]: any;
}> => {
	// Special case for errors, so that the condition right below (when league is loading) does not cause no update
	if (viewId === "error") {
		return {};
	}

	if (typeof g.get("lid") === "number" && !local.leagueLoaded) {
		return;
	}

	let inputs;
	if (Object.hasOwn(processInputs, viewId)) {
		// https://github.com/microsoft/TypeScript/issues/21732
		// @ts-expect-error
		inputs = processInputs[viewId](params, ctxBBGM);
	}
	if (inputs === undefined) {
		// Return empty object rather than undefined
		inputs = {};
	}

	if (typeof inputs.redirectUrl === "string") {
		// Short circuit from processInputs alone
		return {
			redirectUrl: inputs.redirectUrl,
		};
	}

	// https://github.com/microsoft/TypeScript/issues/21732
	// @ts-expect-error
	const view = views[viewId];

	if (view) {
		const data = await view(inputs, updateEvents, prevData, conditions);
		return data ?? {};
	}

	return {};
};

const setForceWin = async ({
	gid,
	tidOrTie,
}: {
	gid: number;
	tidOrTie?: number | "tie";
}) => {
	const game = await idb.cache.schedule.get(gid);
	if (!game) {
		throw new Error("Game not found");
	}

	game.forceWin = tidOrTie;
	await idb.cache.schedule.put(game);
};

const setForceWinAll = async ({
	tid,
	type,
}: {
	tid: number;
	type: "none" | "win" | "lose" | "tie";
}) => {
	const games = await idb.cache.schedule.getAll();
	for (const game of games) {
		if (game.homeTid !== tid && game.awayTid !== tid) {
			continue;
		}

		if (type === "win") {
			game.forceWin = tid;
		} else if (type === "lose") {
			game.forceWin = game.homeTid === tid ? game.awayTid : game.homeTid;
		} else if (type === "tie") {
			game.forceWin = "tie";
		} else {
			delete game.forceWin;
		}

		await idb.cache.schedule.put(game);
	}

	await toUI("realtimeUpdate", [["gameSim"]]);
};

const setGOATFormula = async ({
	formula,
	type,
}: {
	formula: string;
	type: "season" | "career";
}) => {
	// Arbitrary player for testing
	const players = await idb.cache.players.getAll();
	const p = players[0];
	if (!p) {
		throw new Error("No players found");
	}

	// Confirm it actually works
	goatFormula.evaluate(
		p,
		formula,
		type === "season"
			? {
					type,
					season: g.get("season"),
				}
			: {
					type,
				},
	);

	if (type === "career") {
		await league.setGameAttributes({
			goatFormula: formula,
		});
		await toUI("realtimeUpdate", [["g.goatFormula"]]);
	} else {
		await league.setGameAttributes({
			goatSeasonFormula: formula,
		});
		await toUI("realtimeUpdate", [["g.goatSeasonFormula"]]);
	}
};

const setLocal = async <T extends keyof Local>([key, value]: [T, Local[T]]) => {
	if (key === "autoSave" && value === false) {
		await idb.cache.flush();
	}

	// @ts-expect-error
	local[key] = value;

	if (key === "autoSave" && value === true) {
		await idb.cache.flush();
		await idb.cache.fill();

		await league.updateMeta({
			phaseText: `${g.get("season")} ${PHASE_TEXT[g.get("phase")]}`,
			difficulty: g.get("difficulty"),
		});
	}
};

const setNote = async (info: NoteInfo & { editedNote: string }) => {
	let cacheStore;
	let object;
	if (info.type === "draftPick") {
		cacheStore = idb.cache.draftPicks;
		object = await idb.cache.draftPicks.get(info.dpid);
	} else if (info.type === "game") {
		cacheStore = idb.cache.games;
		object = await idb.getCopy.games(
			{
				gid: info.gid,
			},
			"noCopyCache",
		);
	} else if (info.type === "player") {
		cacheStore = idb.cache.players;
		object = await idb.getCopy.players(
			{
				pid: info.pid,
			},
			"noCopyCache",
		);
	} else {
		cacheStore = idb.cache.teamSeasons;
		object = await idb.getCopy.teamSeasons(
			{
				tid: info.tid,
				season: info.season,
			},
			"noCopyCache",
		);
	}

	if (object) {
		if (info.editedNote === "") {
			delete object.note;
			delete object.noteBool;
		} else {
			object.note = info.editedNote;
			object.noteBool = 1;
		}
		await cacheStore.put(object as any);
	} else {
		throw new Error("Invalid object");
	}

	await toUI("realtimeUpdate", [noteUpdateEvents[info.type]]);
};

const sign = async ({
	pid,
	amount,
	exp,
}: {
	pid: number;
	amount: number;
	exp: number;
}) => {
	// Kind of hacky that a negotiation is needed...
	const negotiation = await idb.cache.negotiations.get(pid);

	if (!negotiation) {
		const errorMsg = await contractNegotiation.create(pid, false);
		if (errorMsg !== undefined && errorMsg) {
			return errorMsg;
		}
	}

	const errorMsg = await contractNegotiation.accept({ pid, amount, exp });

	if (errorMsg !== undefined && errorMsg) {
		return errorMsg;
	}
};

const reSignAll = async (players: any[]) => {
	const userTid = g.get("userTid");
	let negotiations = await idb.cache.negotiations.getAll(); // For Multi Team Mode, might have other team's negotiations going on
	negotiations = negotiations.filter(
		(negotiation) => negotiation.tid === userTid,
	);
	for (const { pid } of negotiations) {
		const p = players.find((p) => p.pid === pid);

		if (p && p.mood.user.willing) {
			const errorMsg = await contractNegotiation.accept({
				pid,
				amount: p.mood.user.contractAmount,
				exp: p.contract.exp,
			});

			if (errorMsg !== undefined && errorMsg) {
				return errorMsg;
			}
		}
	}
};

const updateExpansionDraftSetup = async (changes: {
	numProtectedPlayers?: string;
	numPerTeam?: string;
	teams?: ExpansionDraftSetupTeam[];
}) => {
	const expansionDraft = g.get("expansionDraft");
	if (expansionDraft.phase !== "setup") {
		throw new Error("Invalid expansion draft phase");
	}

	if (changes.teams) {
		for (const t of changes.teams) {
			for (const key of ["imgURL", "imgURLSmall"] as const) {
				if (typeof t[key] === "string") {
					t[key] = helpers.stripBbcode(t[key]);
				}
			}
		}
	}

	await league.setGameAttributes({
		expansionDraft: {
			...expansionDraft,
			...changes,
		},
	});
};

const advanceToPlayerProtection = async (
	param: unknown,
	conditions: Conditions,
) => {
	const errors = await expansionDraft.advanceToPlayerProtection(
		false,
		conditions,
	);

	if (errors) {
		return errors;
	}

	await phase.newPhase(PHASE.EXPANSION_DRAFT, conditions);
};

const autoProtect = async (tid: number) => {
	const pids = await expansionDraft.autoProtect(tid);
	await expansionDraft.updateProtectedPids(tid, pids);
	await toUI("realtimeUpdate", [["gameAttributes"]]);
};

const cancelExpansionDraft = async () => {
	const expansionDraft = g.get("expansionDraft");
	if (expansionDraft.phase !== "protection") {
		throw new Error("Invalid expansion draft phase");
	}
	for (let i = 0; i < expansionDraft.expansionTids.length; i++) {
		await removeLastTeam();
	}
	await league.setGameAttributes({
		expansionDraft: { phase: "setup" },
		phase: g.get("nextPhase"),
		nextPhase: undefined,
	});
	await updatePhase();
	await updatePlayMenu();
};

const updateProtectedPlayers = async ({
	tid,
	protectedPids,
}: {
	tid: number;
	protectedPids: number[];
}) => {
	await expansionDraft.updateProtectedPids(tid, protectedPids);
	await toUI("realtimeUpdate", [["gameAttributes"]]);
};

const startExpansionDraft = async () => {
	await expansionDraft.start();
	await toUI("realtimeUpdate", [["gameAttributes"]]);
};

const startFantasyDraft = async (tids: number[], conditions: Conditions) => {
	await phase.newPhase(PHASE.FANTASY_DRAFT, conditions, tids);
};

const switchTeam = async (tid: number, conditions: Conditions) => {
	const t = await idb.cache.teams.get(tid);
	if (!t) {
		throw new Error("Invalid tid");
	}

	const userTid = g.get("userTid");
	if (userTid !== tid) {
		await team.switchTo(tid);
		await updateStatus("Idle");
		await updatePlayMenu();
	}

	if (g.get("otherTeamsWantToHire")) {
		await league.setGameAttributes({
			otherTeamsWantToHire: false,
		});
		await updateStatus("Idle");
		await updatePlayMenu();
	}

	const expansionDraft = g.get("expansionDraft");
	if (
		g.get("phase") === PHASE.EXPANSION_DRAFT &&
		expansionDraft.phase === "protection" &&
		expansionDraft.allowSwitchTeam
	) {
		await league.setGameAttributes({
			expansionDraft: {
				...expansionDraft,
				allowSwitchTeam: false,
			},
		});

		if (userTid !== tid) {
			logEvent(
				{
					saveToDb: false,
					text: `You are now the GM of a new expansion team, the ${t.region} ${t.name}!`,
					type: "info",
				},
				conditions,
			);
		}
	}
};

const onLiveSimOver = async () => {
	local.liveSimRatingsStatsPopoverPlayers = undefined;

	await toUI("updateLocal", [{ liveGameInProgress: false }]);
};

const updateBudget = async ({
	budgetLevels,
	adjustForInflation,
	autoTicketPrice,
}: {
	budgetLevels: {
		coaching: number;
		facilities: number;
		health: number;
		scouting: number;
		ticketPrice: number;
	};
	adjustForInflation: boolean;
	autoTicketPrice: boolean;
}) => {
	const userTid = g.get("userTid");

	const t = await idb.cache.teams.get(userTid);
	if (!t) {
		throw new Error("Invalid tid");
	}

	for (const key of helpers.keys(budgetLevels)) {
		// Check for NaN before updating
		// eslint-disable-next-line no-self-compare
		if (budgetLevels[key] === budgetLevels[key]) {
			t.budget[key] = budgetLevels[key];
		}
	}

	if (autoTicketPrice && t.autoTicketPrice === false) {
		t.budget.ticketPrice = await getAutoTicketPriceByTid(userTid);
	}

	t.adjustForInflation = adjustForInflation;
	t.autoTicketPrice = autoTicketPrice;

	await idb.cache.teams.put(t);
	await toUI("realtimeUpdate", [["teamFinances"]]);
};

const updateDefaultSettingsOverrides = async (
	defaultSettingsOverrides: Partial<Settings>,
) => {
	if (Object.keys(defaultSettingsOverrides).length === 0) {
		await idb.meta.delete("attributes", "defaultSettingsOverrides");
	} else {
		await idb.meta.put(
			"attributes",
			defaultSettingsOverrides,
			"defaultSettingsOverrides",
		);
	}
};

const updateGameAttributes = async (
	gameAttributes: Partial<GameAttributesLeague>,
) => {
	await league.setGameAttributes(gameAttributes);
	await toUI("realtimeUpdate", [["gameAttributes"]]);
};
const updateGameAttributesGodMode = async (
	settings: Settings,
	conditions: Conditions,
) => {
	const gameAttributes: Partial<GameAttributesLeague> = omit(settings, [
		"repeatSeason",
	]);

	const currentRepeatSeasonType = g.get("repeatSeason")?.type ?? "disabled";
	const repeatSeason = settings.repeatSeason;

	if (repeatSeason !== "disabled" && repeatSeason !== currentRepeatSeasonType) {
		if (g.get("phase") < 0 || g.get("phase") > PHASE.DRAFT_LOTTERY) {
			throw new Error("Groundhog Day can only be enabled before the draft");
		}
	}

	if (
		gameAttributes.forceHistoricalRosters &&
		!g.get("forceHistoricalRosters")
	) {
		if (g.get("phase") < 0 || g.get("phase") > PHASE.DRAFT_LOTTERY) {
			throw new Error(
				"Force Historical Rosters can only be enabled before the draft",
			);
		}

		if (REAL_PLAYERS_INFO && g.get("season") >= REAL_PLAYERS_INFO.MAX_SEASON) {
			throw new Error(
				"Force Historical Rosters can only be enabled before the current season",
			);
		}
	}

	// Will be handled in setRepeatSeason, don't pass through a string
	delete gameAttributes.repeatSeason;

	// Check schedule, unless it'd be too slow
	const teams = (await idb.cache.teams.getAll()).filter((t) => !t.disabled);
	if (teams.length < TOO_MANY_TEAMS_TOO_SLOW) {
		await season.newSchedule(
			teams.map((t) => ({
				tid: t.tid,
				seasonAttrs: {
					cid: t.cid,
					did: t.did,
				},
			})),
			conditions,
		);
	}

	const currentRpdPot = g.get("rpdPot");
	const currentRealPlayerDeterminism = g.get("realPlayerDeterminism");

	await league.setGameAttributes(gameAttributes);

	if (repeatSeason !== currentRepeatSeasonType) {
		await league.setRepeatSeason(repeatSeason);
	}

	// Need to recompute pot for real players?
	if (
		(gameAttributes.rpdPot !== undefined &&
			currentRpdPot !== gameAttributes.rpdPot) ||
		(gameAttributes.realPlayerDeterminism !== undefined &&
			currentRealPlayerDeterminism !== gameAttributes.realPlayerDeterminism)
	) {
		const players = await idb.cache.players.getAll();
		for (const p of players) {
			if (p.real) {
				await player.develop(p, 0);
				await player.updateValues(p);
				await idb.cache.players.put(p);
			}
		}
	}

	await idb.cache.flush();

	await toUI("realtimeUpdate", [["gameAttributes"]]);
};

const updateKeepRosterSorted = async ({
	tid,
	keepRosterSorted,
}: {
	tid: number;
	keepRosterSorted: boolean;
}) => {
	const t = await idb.cache.teams.get(tid);
	if (!t) {
		throw new Error("Invalid tid");
	}

	t.keepRosterSorted = keepRosterSorted;
	await idb.cache.teams.put(t);
	await toUI("realtimeUpdate", [["team"]]);
};

const updateLeague = async ({
	lid,
	obj,
}: {
	lid: number;
	obj: Partial<League>;
}) => {
	await league.updateMeta(obj, lid, true);
	await toUI("realtimeUpdate", [["leagues"]]);
};

const updateMultiTeamMode = async (gameAttributes: {
	userTids: number[];
	userTid?: number;
}) => {
	await league.setGameAttributes(gameAttributes);

	await league.updateMeta();

	await toUI("realtimeUpdate", [["gameAttributes"]]);
};

const updateOptions = async (
	options: Options & {
		realPlayerPhotos: string;
		realTeamInfo: string;
	},
) => {
	const validateRealTeamInfo = (abbrev: string, teamInfo: any) => {
		const strings = [
			"abbrev",
			"region",
			"name",
			"imgURL",
			"imgURLSmall",
			"jersey",
		];
		const numbers = ["pop"];
		for (const [key, value] of Object.entries(teamInfo as any)) {
			if (strings.includes(key)) {
				if (typeof value !== "string") {
					throw new Error(
						`Invalid data format in real team info - value for "${abbrev}.${key}" is not a string`,
					);
				}
			} else if (numbers.includes(key)) {
				if (typeof value !== "number") {
					throw new Error(
						`Invalid data format in real team info - value for "${abbrev}.${key}" is not a number`,
					);
				}
			} else if (key === "colors") {
				if (!Array.isArray(value)) {
					throw new Error(
						`Invalid data format in real team info - value for "${abbrev}.${key}" is not an array`,
					);
				}
				if (value.length !== 3) {
					throw new Error(
						`Invalid data format in real team info - value for "${abbrev}.${key}" should have 3 colors`,
					);
				}
				for (const color of value) {
					if (typeof color !== "string") {
						throw new Error(
							`Invalid data format in real team info - value for "${abbrev}.${key}" is not an array of strings`,
						);
					}
				}
			} else if (key !== "seasons") {
				throw new Error(
					`Invalid data format in real team info - unknown property "${abbrev}.${key}"`,
				);
			}
		}
	};

	let realPlayerPhotos;
	let realTeamInfo;
	if (options.realPlayerPhotos !== "") {
		try {
			realPlayerPhotos = JSON.parse(options.realPlayerPhotos);
		} catch (error) {
			console.log(error);
			throw new Error("Invalid JSON in real player photos");
		}
		if (typeof realPlayerPhotos !== "object") {
			throw new Error(
				"Invalid data format in real player photos - input is not an object",
			);
		}
		for (const [key, value] of Object.entries(realPlayerPhotos)) {
			if (typeof value !== "string") {
				throw new Error(
					`Invalid data format in real player photos - value for "${key}" is not a string`,
				);
			}
		}
	}
	if (options.realTeamInfo !== "") {
		try {
			realTeamInfo = JSON.parse(options.realTeamInfo);
		} catch (error) {
			console.log(error);
			throw new Error("Invalid JSON in real team info");
		}
		if (typeof realTeamInfo !== "object") {
			throw new Error(
				"Invalid data format in real team info - input is not an object",
			);
		}
		for (const [abbrev, teamInfo] of Object.entries(realTeamInfo)) {
			validateRealTeamInfo(abbrev, teamInfo);
			if (typeof teamInfo !== "object" || teamInfo === null) {
				throw new Error(
					"Invalid data format in real team info - input is not an object",
				);
			}
			if ((teamInfo as any).seasons) {
				for (const [key, value] of Object.entries((teamInfo as any).seasons)) {
					const keyParsed = Number.parseInt(key);
					if (Number.isNaN(keyParsed)) {
						throw new Error(
							`Invalid data format in real player photos - season is not an integer`,
						);
					}
					validateRealTeamInfo(`${abbrev}.${key}`, value);
				}
			}
		}
	}

	const attributesStore = (
		await idb.meta.transaction("attributes", "readwrite")
	).store;
	await attributesStore.put(
		{
			units: options.units,
			fullNames: options.fullNames,
			phaseChangeRedirects: options.phaseChangeRedirects,
		},
		"options",
	);
	await attributesStore.put(realPlayerPhotos, "realPlayerPhotos");
	await attributesStore.put(realTeamInfo, "realTeamInfo");
	await toUI("updateLocal", [
		{ units: options.units, fullNames: options.fullNames },
	]);
	await toUI("realtimeUpdate", [["options"]]);
};

const updatePlayThroughInjuries = async ({
	tid,
	value,
	playoffs,
}: {
	tid: number;
	value: number;
	playoffs?: boolean;
}) => {
	const index = playoffs ? 1 : 0;

	const t = await idb.cache.teams.get(tid);
	if (t) {
		t.playThroughInjuries[index] = value;
		await idb.cache.teams.put(t);

		// So roster re-renders, which is needed to maintain state on mobile when the panel is closed
		await toUI("realtimeUpdate", [["playerMovement"]]);

		const phase = actualPhase();
		if (
			(!playoffs &&
				(phase === PHASE.REGULAR_SEASON ||
					phase === PHASE.AFTER_TRADE_DEADLINE)) ||
			(playoffs && phase === PHASE.PLAYOFFS)
		) {
			await recomputeLocalUITeamOvrs();
		}
	}
};

const updatePlayerWatch = async ({
	pid,
	watch,
}: {
	pid: number;
	watch: number;
}) => {
	let p;
	if (local.exhibitionGamePlayers) {
		p = local.exhibitionGamePlayers[pid];
		if (!p) {
			return;
		}
	} else {
		p = await idb.getCopy.players({ pid }, "noCopyCache");
	}

	if (p) {
		if (
			watch < 1 ||
			(!local.exhibitionGamePlayers && watch > g.get("numWatchColors"))
		) {
			delete p.watch;
		} else {
			p.watch = watch;
		}
		if (!local.exhibitionGamePlayers) {
			await idb.cache.players.put(p);
			await Promise.all([
				toUI("crossTabEmit", [["updateWatch", getUpdateWatch([p])]]),
				toUI("realtimeUpdate", [["playerMovement", "watchList"]]),
			]);
		}
	}
};

const getPlayersNextWatch = (players: Player[]) => {
	const watchCounts = new Map<number, number>();
	for (const p of players) {
		const watch = p.watch ?? 0;
		const count = watchCounts.get(watch) ?? 0;
		watchCounts.set(watch, count + 1);
	}
	const mostCommonCurrentWatch = maxBy(
		Array.from(watchCounts.entries()),
		1,
	)![0];

	const nextWatch =
		(mostCommonCurrentWatch + 1) % (g.get("numWatchColors") + 1);

	if (nextWatch === 0) {
		return undefined;
	}

	return nextWatch;
};

const updatePlayersWatch = async ({
	pids,
	watch,
}: {
	pids: number[];
	watch?: number;
}) => {
	// Need to get all players to see what the new watch value should be!
	const players = await idb.getCopies.players(
		{ pids: Array.from(new Set(pids)) },
		"noCopyCache",
	);

	if (players.length === 0) {
		return;
	}

	let nextWatch = watch ?? getPlayersNextWatch(players);
	if (nextWatch === 0) {
		// If we're clearing the watch list, watch value is 0, but we want to make it undefined in player object
		nextWatch = undefined;
	}

	for (const p of players) {
		// Only update players who changed
		if (p.watch !== nextWatch) {
			if (nextWatch === undefined) {
				delete p.watch;
			} else {
				p.watch = nextWatch;
			}
			await idb.cache.players.put(p);
		}
	}

	await Promise.all([
		toUI("crossTabEmit", [["updateWatch", getUpdateWatch(players)]]),
		toUI("realtimeUpdate", [["playerMovement", "watchList"]]),
	]);
};

const updatePlayingTime = async ({
	pid,
	ptModifier,
}: {
	pid: number;
	ptModifier: number;
}) => {
	const p = await idb.cache.players.get(pid);
	if (!p) {
		throw new Error("Invalid pid");
	}
	p.ptModifier = ptModifier;
	await idb.cache.players.put(p);
	await toUI("realtimeUpdate", [["playerMovement"]]);
};

const updatePlayoffTeams = async (
	teams: {
		tid: number;
		cid: number;
		seed: number | undefined;
	}[],
) => {
	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
	if (playoffSeries) {
		const { playIns, series } = playoffSeries;
		const byConf = await season.getPlayoffsByConf(g.get("season"));

		const findTeam = (seed: number, cid: number) => {
			// If byConf, we need to find the seed in the same conference, cause multiple teams will have this seed. Otherwise, can just check seed.
			const t = teams.find(
				(t) => seed === t.seed && (!byConf || cid === t.cid),
			);

			if (!t) {
				throw new Error("Team not found");
			}

			return t;
		};

		const tidsPlayoffs = new Set();

		const checkMatchups = (matchups: (typeof series)[0]) => {
			for (const matchup of matchups) {
				const home = findTeam(matchup.home.seed, matchup.home.cid);
				matchup.home.tid = home.tid;
				matchup.home.cid = home.cid;
				tidsPlayoffs.add(home.tid);
				if (matchup.away) {
					const away = findTeam(matchup.away.seed, matchup.away.cid);
					matchup.away.tid = away.tid;
					matchup.away.cid = away.cid;
					tidsPlayoffs.add(away.tid);
				}
			}
		};

		checkMatchups(series[0]!);

		if (playIns) {
			checkMatchups(playIns.flatMap((playIn) => playIn.slice(0, 2)));
		}

		await idb.cache.playoffSeries.put(playoffSeries);

		// Update schedule, since games might have changed
		await season.newSchedulePlayoffsDay();

		// Update teamSeasons, since playoffRoundsWon might need to be updated
		const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
			"teamSeasonsBySeasonTid",
			[[g.get("season")], [g.get("season"), "Z"]],
		);
		for (const teamSeason of teamSeasons) {
			const playoffRoundsWon = tidsPlayoffs.has(teamSeason.tid) ? 0 : -1;
			if (playoffRoundsWon !== teamSeason.playoffRoundsWon) {
				teamSeason.playoffRoundsWon = playoffRoundsWon;
				await idb.cache.teamSeasons.put(teamSeason);
			}
		}

		await toUI("realtimeUpdate", [["playoffs"]]);
	}
};

const updateTeamInfo = async ({
	teams: newTeams,
	from,
}: {
	teams: {
		tid: number;
		cid?: number;
		did: number;
		region: string;
		name: string;
		abbrev: string;
		imgURL?: string;
		imgURLSmall?: string;
		pop: number | string;
		stadiumCapacity: number | string;
		colors: [string, string, string];
		jersey: string;
		disabled?: boolean;
	}[];
	from: "manageTeams" | "manageConfs";
}) => {
	const teams = await idb.cache.teams.getAll();

	const newTeamsByTid = groupByUnique(newTeams, "tid");

	const newTeamsIncludingDisabled = [];

	for (const t of teams) {
		const newTeam = newTeamsByTid[t.tid];
		if (!newTeam) {
			// manageConfs doesn't include disabled teams, on purpose
			if (from === "manageConfs" && t.disabled) {
				newTeamsIncludingDisabled.push(t);
				continue;
			} else {
				throw new Error(`New team not found for tid ${t.tid}`);
			}
		}
		newTeamsIncludingDisabled.push(newTeam);

		if (newTeam.did !== undefined) {
			const divs = g.get("divs");
			const newDiv = divs.find((div) => div.did === newTeam.did) ?? divs[0];
			t.did = newDiv.did;
			t.cid = newDiv.cid;
		}

		t.region = newTeam.region;
		t.name = newTeam.name;
		t.abbrev = newTeam.abbrev;

		for (const key of ["imgURL", "imgURLSmall"] as const) {
			if (Object.hasOwn(newTeam, key)) {
				t[key] = newTeam[key];
				if (typeof t[key] === "string") {
					t[key] = helpers.stripBbcode(t[key]);
				}
			}
		}

		t.colors = newTeam.colors;
		t.jersey = newTeam.jersey;

		t.pop = helpers.localeParseFloat(newTeam.pop as string);
		t.stadiumCapacity = Number.parseInt(newTeam.stadiumCapacity as string);

		const disableTeam = newTeam.disabled && !t.disabled;
		const enableTeam = !newTeam.disabled && t.disabled;

		t.disabled = !!newTeam.disabled;

		if (Number.isNaN(t.pop)) {
			throw new Error("Invalid pop");
		}

		if (Number.isNaN(t.stadiumCapacity)) {
			throw new Error("Invalid stadiumCapacity");
		}

		await idb.cache.teams.put(t);

		if (enableTeam) {
			await draft.genPicks();
			await draft.deleteLotteryResultIfNoDraftYet();

			if (t.tid === g.get("userTid")) {
				await league.setGameAttributes({
					gameOver: false,
				});
				await updateStatus();
				await updatePlayMenu();
			}
		} else if (disableTeam) {
			await team.disable(t.tid);
		}

		// Also apply team info changes to this season
		if (actualPhase() < PHASE.PLAYOFFS) {
			let teamSeason: TeamSeason | TeamSeasonWithoutKey | undefined =
				await idb.cache.teamSeasons.indexGet("teamSeasonsByTidSeason", [
					t.tid,
					g.get("season"),
				]);

			if (enableTeam) {
				const prevSeason = await idb.cache.teamSeasons.indexGet(
					"teamSeasonsByTidSeason",
					[t.tid, g.get("season") - 1],
				);

				teamSeason = team.genSeasonRow(t, prevSeason);
			}

			if (teamSeason && !t.disabled) {
				teamSeason.cid = t.cid;
				teamSeason.did = t.did;
				teamSeason.region = t.region;
				teamSeason.name = t.name;
				teamSeason.abbrev = t.abbrev;
				teamSeason.imgURL = t.imgURL;
				teamSeason.imgURLSmall = t.imgURLSmall;
				teamSeason.colors = t.colors;
				teamSeason.jersey = t.jersey;
				teamSeason.pop = t.pop;
				teamSeason.stadiumCapacity = t.stadiumCapacity;

				if (teamSeason.imgURLSmall === "") {
					delete teamSeason.imgURLSmall;
				}

				await idb.cache.teamSeasons.put(teamSeason);
			}
		}

		if (t.imgURLSmall === "") {
			delete t.imgURLSmall;
		}
	}

	await league.setGameAttributes({
		teamInfoCache: orderBy(newTeamsIncludingDisabled, "tid").map((t) => ({
			abbrev: t.abbrev,
			disabled: t.disabled,
			imgURL: t.imgURL,
			imgURLSmall: t.imgURLSmall === "" ? undefined : t.imgURLSmall,
			name: t.name,
			region: t.region,
		})),

		// numActiveTeams is only needed when enabling a disabled team, and numTeams should never be needed. But might as well do these every time just to be sure, because it's easy.
		numActiveTeams: newTeamsIncludingDisabled.filter((t) => !t.disabled).length,
		numTeams: newTeamsIncludingDisabled.length,
	});

	await league.updateMeta();
};

const updateConfsDivs = async ({
	confs,
	divs,
	teams,
}: {
	confs: Conf[];
	divs: Div[];
	teams: (Omit<Parameters<typeof updateTeamInfo>[0]["teams"][number], "cid"> & {
		cid: number;
	})[];
}) => {
	// First some sanity checks to make sure they're consistent
	for (const div of divs) {
		const conf = confs.find((c) => c.cid === div.cid);
		if (!conf) {
			throw new Error("div has invalid cid");
		}
	}
	for (const t of teams) {
		const div = divs.find((d) => d.did === t.did);
		if (!div) {
			throw new Error("team has invalid did");
		}
		if (div.cid !== t.cid) {
			throw new Error("team has invalid cid");
		}
	}

	const currentTeams = await idb.cache.teams.getAll();
	for (const t of currentTeams) {
		if (t.disabled) {
			continue;
		}

		const info = teams.find((row) => row.tid === t.tid);
		if (!info) {
			throw new Error("Inconsistent teams");
		}
	}

	await league.setGameAttributes({ confs: confs as any, divs: divs as any });

	await updateTeamInfo({ teams, from: "manageConfs" });
};

const updateAwards = async (
	awards: any,
	conditions: Conditions,
): Promise<any> => {
	const awardsInitial = await idb.getCopy.awards(
		{
			season: awards.season,
		},
		"noCopyCache",
	);

	if (!awardsInitial) {
		throw new Error("awardsInitial not found");
	}

	// Delete old awards
	const awardsByPlayerToDelete: AwardsByPlayer = [];
	addSimpleAndTeamAwardsToAwardsByPlayer(awardsInitial, awardsByPlayerToDelete);
	await deleteAwardsByPlayer(awardsByPlayerToDelete, awards.season);

	// Add new awards
	const awardsByPlayer: AwardsByPlayer = [];
	addSimpleAndTeamAwardsToAwardsByPlayer(awards, awardsByPlayer);
	await idb.cache.awards.put(awards);
	await saveAwardsByPlayer(awardsByPlayer, conditions, awards.season, false);
};

const upgrade65Estimate = async () => {
	// cursor is null if there are no saved box scores. Using IDBObjectStore.count() is slower if there are a lot of games
	const cursor = await idb.league.transaction("games").store.openKeyCursor();
	if (!cursor) {
		return {
			numFeats: 0,
			numPlayoffSeries: 0,
		};
	}

	const [numFeats, numPlayoffSeries] = await Promise.all([
		idb.league.count("playerFeats"),
		idb.league.count("playoffSeries"),
	]);

	return {
		numFeats,
		numPlayoffSeries,
	};
};

const upgrade65 = async () => {
	console.time("upgrade65");
	const transaction = idb.league.transaction(
		["games", "playerFeats", "playoffSeries"],
		"readwrite",
	);
	await upgradeGamesVersion65({
		transaction,
		stopIfTooMany: false,
		lid: g.get("lid"),
	});
	console.timeEnd("upgrade65");
};

const upsertCustomizedPlayer = async (
	{
		p,
		originalTid,
		season,
		recomputePosOvrPot,
	}: {
		p: Player | PlayerWithoutKey;
		originalTid: number | undefined;
		season: number;
		recomputePosOvrPot: boolean;
	},
	conditions: Conditions,
): Promise<number> => {
	if (p.tid >= 0) {
		const t = await idb.cache.teams.get(p.tid);
		if (!t) {
			throw new Error("Invalid tid");
		}

		if (t.retiredJerseyNumbers) {
			const retiredJerseyNumbers = t.retiredJerseyNumbers.map(
				(row) => row.number,
			);
			const jerseyNumber = helpers.getJerseyNumber(p);
			if (jerseyNumber && retiredJerseyNumbers.includes(jerseyNumber)) {
				throw new Error(
					`Jersey number "${jerseyNumber}" is retired by the ${t.region} ${t.name}. Either un-retire it at Team > History or pick a new number.`,
				);
			}
		}
	}

	p.imgURL = helpers.stripBbcode(p.imgURL);

	const r = p.ratings.length - 1;

	// Fix draft and ratings season
	if (p.tid === PLAYER.UNDRAFTED) {
		if (p.draft.year < season) {
			p.draft.year = season;
		}

		// Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
		if (p.draft.year === season && actualPhase() >= PHASE.RESIGN_PLAYERS) {
			p.draft.year += 1;
		}

		p.ratings[r].season = p.draft.year;
	} else if (p.tid !== PLAYER.RETIRED) {
		p.retiredYear = Infinity;

		// If a player was a draft prospect (or some other weird shit happened), ratings season might be wrong
		p.ratings[r].season = g.get("season");
	}

	// If player was retired, add ratings (but don't develop, because that would change ratings)
	if (originalTid === PLAYER.RETIRED && p.tid !== PLAYER.RETIRED) {
		if (g.get("season") - p.ratings[r].season > 0) {
			player.addRatingsRow(p);
		}
	}

	// If player is now retired, check HoF eligibility
	if (
		typeof p.pid === "number" &&
		p.tid === PLAYER.RETIRED &&
		originalTid !== PLAYER.RETIRED
	) {
		await player.retire(p as Player, conditions, {
			forceHofNotification: true,
		});
	}

	// Recalculate player pos, ovr, pot, and values if necessary
	const originalPot = p.ratings.at(-1).pot;
	await player.develop(p, 0);
	if (!recomputePosOvrPot) {
		// Make sure not to randomly change pot if it was not necessary (no ratings/age change, and in non-basketball sports no pos change).
		// Why do this here, rather than just calling develop only if this stuff changed? Because develop handles PlayerRatings.pos being set to the right value too, and that can change in BBGM even if no ratings change.
		p.ratings.at(-1).pot = originalPot;
	}
	await player.updateValues(p);

	// Add regular season or playoffs stat row, if necessary
	if (p.tid >= 0 && p.tid !== originalTid && g.get("phase") <= PHASE.PLAYOFFS) {
		// If it is the playoffs, this is only necessary if p.tid actually made the playoffs, but causes only cosmetic harm otherwise.
		await player.addStatsRow(p, g.get("phase") === PHASE.PLAYOFFS);
	}

	if (p.tid >= 0 && p.tid !== originalTid) {
		if (!p.transactions) {
			p.transactions = [];
		}
		p.transactions.push({
			season: g.get("season"),
			phase: g.get("phase"),
			tid: p.tid,
			type: "godMode",
		});
	}

	// Fill in player names for relatives
	const relatives: Relative[] = [];

	const getInverseType = (type: Player["relatives"][number]["type"]) => {
		let type2: typeof type;
		if (type === "father") {
			type2 = "son";
		} else if (type === "son") {
			type2 = "father";
		} else {
			type2 = "brother";
		}

		return type2;
	};

	const ensureRelationExists = async (
		p: Player,
		p2: Player,
		type: Player["relatives"][number]["type"],
	) => {
		const type2 = getInverseType(type);

		let name = p.firstName;
		if (p.lastName) {
			name += ` ${p.lastName}`;
		}

		const existingRelation = p2.relatives.find(
			(rel) => rel.type === type2 && rel.pid === p.pid,
		);
		if (existingRelation) {
			// We found relation! Make sure name is correct
			if (name !== existingRelation.name) {
				existingRelation.name = name;
				await idb.cache.players.put(p2);
			}
		} else {
			// Need to add this relation
			p2.relatives.push({
				type: type2,
				pid: p.pid,
				name,
			});
			await idb.cache.players.put(p2);
		}
	};

	for (const rel of p.relatives) {
		const p2 = await idb.getCopy.players(
			{
				pid: rel.pid,
			},
			"noCopyCache",
		);

		if (p2) {
			rel.name = p2.firstName;
			if (p2.lastName) {
				rel.name += ` ${p2.lastName}`;
			}
		}

		if (rel.name !== "") {
			// This will keep names of deleted players too, just not blank entries
			relatives.push(rel);
		}
	}

	p.relatives = relatives;

	const prevPlayer =
		p.pid !== undefined
			? await idb.getCopy.players({ pid: p.pid }, "noCopyCache")
			: undefined;
	if (prevPlayer) {
		// Any relation in here that is no longer in p should be deleted in the corresponding player too
		for (const prevRel of prevPlayer.relatives) {
			const currentRel = p.relatives.find(
				(rel) => rel.type === prevRel.type && rel.pid === prevRel.pid,
			);
			if (!currentRel) {
				// prevRel has been deleted!
				const p2 = await idb.getCopy.players(
					{
						pid: prevRel.pid,
					},
					"noCopyCache",
				);
				if (p2) {
					p2.relatives = p2.relatives.filter(
						(rel) =>
							!(
								rel.type === getInverseType(prevRel.type) &&
								rel.pid === prevPlayer.pid
							),
					);
					await idb.cache.players.put(p2);
				}
			}
		}

		// If the injury was added in this edit, do some stuff depending on what the previous injury was
		const editedInjuryType = p.injury.type !== prevPlayer.injury.type;
		const editedInjuryGames =
			p.injury.gamesRemaining !== prevPlayer.injury.gamesRemaining;
		if (editedInjuryType || editedInjuryGames) {
			let lastInjuriesEntry = p.injuries.at(-1);
			if (lastInjuriesEntry?.type !== prevPlayer.injury.type) {
				// If somehow injuries does not contain the previous injury, ignore it
				lastInjuriesEntry = undefined;
			}

			// Was the injury type changed, or just the duration of injury?
			if (editedInjuryType) {
				// Adjust prevInjuriesEntry, since that old injury no longer applies and it healed prematurely
				if (lastInjuriesEntry) {
					lastInjuriesEntry.games -= prevPlayer.injury.gamesRemaining;
					if (lastInjuriesEntry.games <= 0) {
						// Injury was edited before any days were simmed
						p.injuries.pop();
					}
				}

				if (p.injury.type !== "Healthy") {
					p.injuries.push({
						season: g.get("season"),
						games: p.injury.gamesRemaining,
						type: p.injury.type,
					});
				}
			} else {
				// Only the duration of injury was changed, so adjust lastInjuriesEntry to reflect that
				if (lastInjuriesEntry) {
					const extraGames =
						p.injury.gamesRemaining - prevPlayer.injury.gamesRemaining;
					lastInjuriesEntry.games += extraGames;
					if (lastInjuriesEntry.games <= 0) {
						// Injury was edited before any days were simmed
						p.injuries.pop();
					}
				}
			}
		}
	}

	const jerseyNumber = p.jerseyNumber;
	if (jerseyNumber !== undefined && p.tid >= 0) {
		// Update stats row if necessary
		player.setJerseyNumber(p, jerseyNumber);

		// Extra write so genJerseyNumber sees it
		await idb.cache.players.put(p);

		// If jersey number is the same as a teammate, edit the teammate's
		const conflicts = (
			await idb.cache.players.indexGetAll("playersByTid", p.tid)
		).filter((p2) => p2.pid !== p.pid && p2.jerseyNumber === jerseyNumber);
		for (const conflict of conflicts) {
			const newJerseyNumber = await player.genJerseyNumber(conflict);
			player.setJerseyNumber(conflict, newJerseyNumber);
			await idb.cache.players.put(conflict);
		}
	}

	// Save to database, adding pid if it doesn't already exist
	await idb.cache.players.put(p);

	// Only after pid is known - update current relatives
	for (const rel of p.relatives) {
		const p2 = await idb.getCopy.players(
			{
				pid: rel.pid,
			},
			"noCopyCache",
		);

		if (p2) {
			await ensureRelationExists(p as Player, p2, rel.type);
		}
	}

	// In case a player was injured or moved to another team
	await recomputeLocalUITeamOvrs();

	// @ts-expect-error
	return p.pid;
};

const clearTrade = async (
	type: "all" | "other" | "user" | "keepUntradeable",
) => {
	await trade.clear(type);
	await toUI("realtimeUpdate", []);
};

const createTrade = async (teams: TradeTeams) => {
	await trade.create(teams);
	await toUI("realtimeUpdate", []);
};

const proposeTrade = async (forceTrade: boolean, conditions: Conditions) => {
	const { teams } = await trade.get();
	const dv = await team.valueChange(
		teams[1].tid,
		teams[0].pids,
		teams[1].pids,
		teams[0].dpids,
		teams[1].dpids,
		undefined,
		g.get("userTid"),
	);
	const aiWillAcceptTrade = dv > 0;
	if (
		aiWillAcceptTrade &&
		teams[1].pids.length === 0 &&
		teams[1].dpids.length === 0
	) {
		let assetsText;
		const numAssets = teams[0].pids.length + teams[0].dpids.length;
		if (teams[0].pids.length === 0) {
			assetsText = helpers.plural("Pick", numAssets);
		} else if (teams[0].dpids.length === 0) {
			assetsText = helpers.plural("Player", numAssets);
		} else {
			assetsText = helpers.plural("Asset", numAssets);
		}

		const proceed = await toUI(
			"confirm",
			[
				"Are you sure you want to propose a trade where you receive nothing?",
				{
					okText: `Give Away ${assetsText}`,
				},
			],
			conditions,
		);

		if (!proceed) {
			return;
		}
	}

	const output = await trade.propose(forceTrade);
	await toUI("realtimeUpdate", []);
	return output;
};

const toggleTradeDeadline = async () => {
	const currentPhase = g.get("phase");
	if (currentPhase === PHASE.AFTER_TRADE_DEADLINE) {
		await league.setGameAttributes({
			phase: PHASE.REGULAR_SEASON,
		});

		await updatePlayMenu();
		await toUI("realtimeUpdate", [["newPhase"]]);
	} else if (currentPhase === PHASE.REGULAR_SEASON) {
		await league.setGameAttributes({
			phase: PHASE.AFTER_TRADE_DEADLINE,
		});

		// Delete scheduled trade deadline
		const schedule = await season.getSchedule();
		const tradeDeadline = schedule.find(
			(game) => game.homeTid === -3 && game.awayTid === -3,
		);
		if (tradeDeadline) {
			await idb.cache.schedule.delete(tradeDeadline.gid);
			await toUI("deleteGames", [[tradeDeadline.gid]]);
		}

		await updatePlayMenu();
		await toUI("realtimeUpdate", [["newPhase"]]);
	}
};

const tradeCounterOffer = async () => {
	const response = await trade.makeItWorkTrade();
	await toUI("realtimeUpdate", []);
	return response;
};

const updateTrade = async (teams: TradeTeams) => {
	await trade.updatePlayers(teams);
	await toUI("realtimeUpdate", []);
};

const validatePointsFormula = async (pointsFormula: string) => {
	if (pointsFormula !== "") {
		new PointsFormulaEvaluator(pointsFormula);
	}
};

const validatePlayoffSettings = async ({
	numRounds,
	numPlayoffByes,
	numActiveTeams,
	playIn,
	playoffsByConf,
	confs,
}: {
	numRounds: number;
	numPlayoffByes: number;
	numActiveTeams: number | undefined;
	playIn: boolean;
	playoffsByConf: boolean;
	confs: GameAttributesLeague["confs"];
}) => {
	// Season doesn't matter, since we provide overrides and skipPlayoffSeries
	const byConf = await season.getPlayoffsByConf(Infinity, {
		skipPlayoffSeries: true,
		playoffsByConf,
		confs,
	});

	season.validatePlayoffSettings({
		numRounds,
		numPlayoffByes: season.getNumPlayoffByes({ numPlayoffByes, byConf }),
		numActiveTeams,
		playIn,
		byConf,
	});
};

const getSavedTrade = async (hash: string) => {
	const value = await idb.cache.savedTrades.get(hash);

	// Use 1 and 0 rather than boolean for consistency with watch list, and in case we want to add more trade lists in the future
	return value ? 1 : 0;
};

const setSavedTrade = async ({
	saved,
	hash,
	tid,
}: {
	saved: number;
	hash: string;
	tid: number;
}) => {
	if (saved !== 0) {
		await idb.cache.savedTrades.put({ hash, tid });
	} else {
		await idb.cache.savedTrades.delete(hash);
	}

	await toUI("realtimeUpdate", [["savedTrades"]]);
};

const clearSavedTrades = async (hashes: string[]) => {
	for (const hash of hashes) {
		await idb.cache.savedTrades.delete(hash);
	}

	await toUI("realtimeUpdate", [["savedTrades"]]);
};

// Normally use season.setSchedule, but this skips various checks and saves exactly what the user has edited
const setScheduleFromEditor = async ({
	regenerated,
	schedule,
}: {
	regenerated: boolean;
	schedule: View<"scheduleEditor">["schedule"];
}) => {
	if (regenerated) {
		// It's the regular season with 0 games played and we're allowed to regenerate the schedule (see canRegenerateSchedule). In that case, season.newSchedule uses the latest settings for numGames/numGamesConf/numGamesDiv/divs, both because that's what the user would want (tweaking schedule settings) and because numGamesConf/numGamesDiv are currently not wrapped. So if we know numGames or divs has changed for next season, we need to update the setting for those (and also confs for consistency) to apply to this season.
		// Originally I added this so updateClinchedPlayoffs would work correctly, but now updateClinchedPlayoffs uses the actual upcoming schedule rather than (numGames - GP) so this shouldn't affect that now. TBH I'm not sure if this matters for other things, but probably it does for something at least!
		const season = g.get("season");
		const toAdjust = ["numGames", "divs", "confs"] as const;
		for (const key of toAdjust) {
			const value = g.getRaw(key);
			if (value.length > 1) {
				const updated = helpers.deepCopy(value);

				const lastValue = updated.at(-1)!;
				if (lastValue.start === season + 1) {
					// We need to update! Either change last entry to current season, or delete 2nd-last entry and overwrite 2nd-last one with current value (if 2nd-last entry was only for this season).

					const secondLastValue = updated.at(-2)!;
					if (secondLastValue.start === season) {
						updated.pop();
						secondLastValue.value = lastValue.value;
					} else {
						lastValue.start = season;
					}

					await idb.cache.gameAttributes.put({
						key,
						value: updated,
					});
					g.setWithoutSavingToDB(key, updated);
				}
			}
		}
	}

	await idb.cache.schedule.clear();

	for (const game of schedule) {
		if (game.type === "placeholder" || game.type === "completed") {
			continue;
		}
		await idb.cache.schedule.add(omit(game, ["gid", "type"]));
	}

	// This is needed in case the upcoming game was edited/deleted
	await initUILocalGames();
};

// Cloud sync API functions
const getCloudLeagues = async () => {
	const userId = localStorage.getItem("cloudUserId");
	if (!userId) {
		return [];
	}
	return cloudSync.getCloudLeagues(userId);
};

const uploadLeagueToCloud = async ({
	onProgress,
}: {
	onProgress?: (store: string, current: number, total: number) => void;
}) => {
	const userId = localStorage.getItem("cloudUserId");
	if (!userId) {
		throw new Error("Not signed in to cloud");
	}

	const lid = g.get("lid");
	if (lid === undefined) {
		throw new Error("No league loaded");
	}

	// Check if already cloud-synced
	const existingCloudId = getCloudIdForLeague(lid);
	if (existingCloudId) {
		throw new Error("This league is already synced to the cloud");
	}

	// Create cloud league
	const leagueName = (await league.getName()) || `League ${lid}`;
	const sport = process.env.SPORT as "basketball" | "football" | "baseball" | "hockey";
	const cloudId = await cloudSync.createCloudLeague(leagueName, sport, userId);

	// Get all data from cache to upload
	const getAllData = async () => {
		const data: Record<string, any[]> = {};
		const stores = [
			"allStars", "awards", "draftLotteryResults", "draftPicks", "events",
			"gameAttributes", "games", "headToHeads", "messages", "negotiations",
			"playerFeats", "players", "playoffSeries", "releasedPlayers", "savedTrades",
			"savedTradingBlock", "schedule", "scheduledEvents", "seasonLeaders",
			"teamSeasons", "teamStats", "teams", "trade",
		];

		for (const store of stores) {
			data[store] = await (idb.cache as any)[store].getAll();
		}

		return data;
	};

	// Upload to cloud
	await cloudSync.uploadLeagueToCloud(cloudId, getAllData, onProgress);

	// Save mapping
	setCloudIdForLeague(lid, cloudId);

	// Enable cloud sync
	idb.cache.enableCloudSync();

	// Connect to cloud for real-time sync
	await cloudSync.connectToCloud(cloudId, userId);

	// Update league metadata
	await cloudSync.updateCloudLeagueMeta({
		season: g.get("season"),
		phase: g.get("phase"),
		userTid: g.get("userTid"),
	});

	// Update UI
	toUI("updateLocal", [{
		cloudSyncStatus: "synced",
		cloudLeagueId: cloudId,
	}]);

	return cloudId;
};

const joinCloudLeague = async (cloudId: string) => {
	const userId = localStorage.getItem("cloudUserId");
	if (!userId) {
		throw new Error("Not signed in to cloud");
	}

	// Connect to the cloud league
	const success = await cloudSync.connectToCloud(cloudId, userId);
	if (!success) {
		throw new Error("Failed to connect to cloud league");
	}

	// Update UI
	toUI("updateLocal", [{
		cloudSyncStatus: "synced",
		cloudLeagueId: cloudId,
	}]);
};

const deleteCloudLeague = async (cloudId: string) => {
	const userId = localStorage.getItem("cloudUserId");
	if (!userId) {
		throw new Error("Not signed in to cloud");
	}

	const success = await cloudSync.deleteCloudLeague(cloudId, userId);
	if (!success) {
		throw new Error("Failed to delete cloud league");
	}
};

const disconnectFromCloud = async () => {
	await cloudSync.disconnectFromCloud();

	const lid = g.get("lid");
	if (lid !== undefined) {
		removeCloudIdForLeague(lid);
	}

	idb.cache.disableCloudSync();

	toUI("updateLocal", [{
		cloudSyncStatus: "disconnected",
		cloudLeagueId: undefined,
	}]);
};

const getCloudSyncStatus = () => {
	return cloudSync.getSyncStatus();
};

export default {
	actions,
	exhibitionGame,
	leagueFileUpload,
	playMenu,
	toolsMenu,
	main: {
		acceptContractNegotiation,
		addTeam,
		advancedPlayerSearch,
		allStarDraftAll,
		allStarDraftOne,
		allStarDraftUser,
		allStarDraftReset,
		allStarDraftSetPlayers,
		allStarGameNow,
		autoSortRoster,
		beforeView,
		cancelContractNegotiation,
		checkAccount: checkAccount2,
		checkParticipationAchievement,
		clearInjuries,
		clearSavedTrades,
		clearNotes,
		clearTrade,
		clearWatchList,
		countNegotiations,
		createLeague,
		createTrade,
		deleteOldData,
		deleteScheduledEvents,
		discardUnsavedProgress,
		draftLottery,
		draftUser,
		dunkGetProjected,
		dunkSetControlling,
		contestSetPlayers,
		dunkSimNext,
		dunkUser,
		evalOnWorker,
		exportDraftClass,
		getExportFilename,
		exportPlayerAveragesCsv,
		exportPlayerGamesCsv,
		generateFace,
		getAutoPos,
		getBornLoc,
		getDefaultInjuries,
		getDefaultNewLeagueSettings,
		getDefaultTragicDeaths,
		getDiamondInfo,
		getJerseyNumberConflict,
		getLeagueInfo,
		getLeagueName,
		getLeagues,
		getPlayerGraphStat,
		getPlayersCommandPalette,
		getLocal,
		getPlayerBioInfoDefaults,
		getPlayerRangeFooterStats,
		getPlayerWatch,
		getProjectedAttendance,
		getRandomCollege,
		getRandomCountry,
		getRandomInjury,
		getRandomJerseyNumber,
		getRandomName,
		getRandomRatings,
		getRandomTeams,
		getSavedTrade,
		getTeamGraphStat,
		getTradingBlockOffers,
		ping,
		handleUploadedDraftClass,
		idbCacheFlush,
		importPlayers,
		importPlayersGetReal,
		incrementTradeProposalsSeed,
		init,
		initGold,
		loadRetiredPlayers,
		lockSet,
		ovr,
		proposeTrade,
		ratingsStatsPopoverInfo,
		reSignAll,
		realtimeUpdate,
		regenerateDraftClass,
		regenerateSchedule,
		releasePlayer,
		expandVote,
		relocateVote,
		cloneLeague,
		removeLeague,
		removePlayers,
		reorderDepthDrag,
		reorderDraftDrag,
		reorderRosterDrag,
		resetPlayingTime,
		retiredJerseyNumberDelete,
		retiredJerseyNumberUpsert,
		runBefore,
		setForceWin,
		setForceWinAll,
		setGOATFormula,
		setLocal,
		setNote,
		setSavedTrade,
		setScheduleFromEditor,
		sign,
		updateExpansionDraftSetup,
		advanceToPlayerProtection,
		autoProtect,
		cancelExpansionDraft,
		updateProtectedPlayers,
		startExpansionDraft,
		startFantasyDraft,
		switchTeam,
		takeControlTeam,
		threeSimNext,
		toggleTradeDeadline,
		tradeCounterOffer,
		onLiveSimOver,
		updateAwards,
		updateBudget,
		updateConfsDivs,
		updateDefaultSettingsOverrides,
		updateGameAttributes,
		updateGameAttributesGodMode,
		updateKeepRosterSorted,
		updateLeague,
		updateMultiTeamMode,
		updateOptions,
		updatePlayThroughInjuries,
		updatePlayerWatch,
		updatePlayersWatch,
		updatePlayingTime,
		updatePlayoffTeams,
		updateTeamInfo,
		updateTrade,
		upgrade65,
		upgrade65Estimate,
		upsertCustomizedPlayer,
		validatePointsFormula,
		validatePlayoffSettings,

		// Cloud sync functions
		getCloudLeagues,
		uploadLeagueToCloud,
		joinCloudLeague,
		deleteCloudLeague,
		disconnectFromCloud,
		getCloudSyncStatus,
	},
};
