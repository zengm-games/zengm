import { csvFormatRows } from "d3-dsv";
import {
	GAME_ACRONYM,
	PHASE,
	PHASE_TEXT,
	PLAYER,
	getCols,
	PLAYER_STATS_TABLES,
	RATINGS,
	isSport,
	bySport,
	gameAttributesArrayToObject,
	DEFAULT_JERSEY,
	POSITIONS,
	GRACE_PERIOD,
} from "../../common";
import actions from "./actions";
import leagueFileUpload, {
	emitProgressStream,
	parseJSON,
} from "./leagueFileUpload";
import processInputs from "./processInputs";
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
} from "../core";
import { connectMeta, idb, iterate } from "../db";
import {
	achievement,
	beforeView,
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
} from "../util";
import { toPolyfillReadable, toPolyfillTransform } from "bbgm-polyfills"; // eslint-disable-line
import views from "../views";
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
	LocalStateUI,
	DunkAttempt,
	AllStarPlayer,
	League,
} from "../../common/types";
import {
	addSimpleAndTeamAwardsToAwardsByPlayer,
	type AwardsByPlayer,
	deleteAwardsByPlayer,
	saveAwardsByPlayer,
} from "../core/season/awards";
import { getScore } from "../core/player/checkJerseyNumberRetirement";
import type { NewLeagueTeam } from "../../ui/views/NewLeague/types";
import { PointsFormulaEvaluator } from "../core/team/evaluatePointsFormula";
import type { Settings } from "../views/settings";
import {
	getActualAttendance,
	getAdjustedTicketPrice,
	getAutoTicketPriceByTid,
	getBaseAttendance,
} from "../core/game/attendance";
import goatFormula from "../util/goatFormula";
import getRandomTeams from "./getRandomTeams";
import { withState } from "../core/player/name";
import { initDefaults } from "../util/loadNames";
import type { PlayerRatings } from "../../common/types.basketball";
import createStreamFromLeagueObject from "../core/league/create/createStreamFromLeagueObject";
import type { IDBPIndex, IDBPObjectStore } from "idb";
import type { LeagueDB } from "../db/connectLeague";
import playMenu from "./playMenu";
import toolsMenu from "./toolsMenu";
import addFirstNameShort from "../util/addFirstNameShort";
import statsBaseball from "../core/team/stats.baseball";
import { extraRatings } from "../views/playerRatings";
import { groupByUnique, maxBy, omit, orderBy } from "../../common/utils";
import {
	finalizePlayersRelativesList,
	formatPlayerRelativesList,
} from "../views/customizePlayer";
import { TOO_MANY_TEAMS_TOO_SLOW } from "../core/season/getInitialNumGamesConfDivSettings";
import * as exhibitionGame from "./exhibitionGame";
import { getSummary } from "../views/trade";
import { getStats, statTypes } from "../views/playerGraphs";
import { DEFAULT_LEVEL } from "../../common/budgetLevels";
import isUntradable from "../core/trade/isUntradable";

const acceptContractNegotiation = async ({
	pid,
	amount,
	exp,
}: {
	pid: number;
	amount: number;
	exp: number;
}): Promise<string | undefined | null> => {
	return contractNegotiation.accept(pid, amount, exp);
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
			for (const t of [0, 1]) {
				const p = allStars.teams[t][i];
				if (p) {
					allStars.remaining.push(p);
				}
			}
		}

		allStars.remaining.push(...oldRemaining);

		allStars.teams = [[allStars.teams[0][0]], [allStars.teams[1][0]]];

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
		].map(p => p.pid);

		const newPlayers = [
			...players.teams[0],
			...players.teams[1],
			...players.remaining,
		];

		const newPids = newPlayers.map(p => p.pid);

		const pidsToDelete = prevPids.filter(pid => !newPids.includes(pid));

		// Delete old awards
		const awardsByPlayerToDelete = pidsToDelete.map(pid => ({
			pid,
			type: "All-Star",
		}));
		await deleteAwardsByPlayer(awardsByPlayerToDelete, g.get("season"));

		// Add new awards
		const awardsByPlayer = newPlayers
			.filter(p => !prevPids.includes(p.pid))
			.map(p => ({
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
			for (let i = 0; i < 2; i++) {
				const p = await idb.cache.players.get(allStars.teams[i][0].pid);
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

	let schedule = (await season.getSchedule()).map(game => {
		const newGame: ScheduleGameWithoutKey = {
			...game,
		};
		// Delete gid, so ASG added to beginning will be in order
		delete newGame.gid;
		return newGame;
	});

	// Does ASG exist in schedule? If so, delete it.
	schedule = schedule.filter(
		game => game.awayTid !== -2 || game.homeTid !== -1,
	);

	// Add 1 to each day, so we can fit in ASG
	for (const game of schedule) {
		game.day += 1;
	}

	// Add new ASG to front of schedule, and adjust days
	schedule.unshift({
		awayTid: -2,
		homeTid: -1,
		day: schedule.length > 0 ? schedule[0].day - 1 : 0,
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

const beforeViewLeague = async (
	{
		newLid,
		loadedLid,
	}: {
		newLid: number;
		loadedLid: number | undefined;
	},
	conditions: Conditions,
) => {
	return beforeView.league(newLid, loadedLid, conditions);
};

const beforeViewNonLeague = async (param: unknown, conditions: Conditions) => {
	return beforeView.nonLeague(conditions);
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

const clearInjuries = async (pid: number[] | "all") => {
	if (pid === "all") {
		const players = await idb.cache.players.getAll();
		for (const p of players) {
			if (p.injury.gamesRemaining > 0) {
				p.injury = {
					type: "Healthy",
					gamesRemaining: 0,
				};
				await idb.cache.players.put(p);
			}
		}
	} else {
		for (const pids of pid) {
			const p = await idb.cache.players.get(pids);
			if (p) {
				p.injury = {
					type: "Healthy",
					gamesRemaining: 0,
				};
				await idb.cache.players.put(p);
			}
		}
	}

	await toUI("realtimeUpdate", [["playerMovement"]]);
	await recomputeLocalUITeamOvrs();
};

const clearWatchList = async () => {
	const players = await idb.getCopies.players(
		{
			watch: true,
		},
		"noCopyCache",
	);
	for (const p of players) {
		delete p.watch;
		await idb.cache.players.put(p);
	}

	await toUI("realtimeUpdate", [["playerMovement", "watchList"]]);
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
			actualTid = realLeague.teams.findIndex(t => t.srID === srID);
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
			baseStream = file.stream() as unknown as ReadableStream;
			sizeInBytes = file.size;
		} else {
			const response = await fetch(url!);
			baseStream = response.body as ReadableStream;
			const size = response.headers.get("content-length");
			if (size) {
				sizeInBytes = Number(size);
			}
		}

		const stream0 = toPolyfillReadable(baseStream);

		// I HAVE NO IDEA WHY THIS LINE IS NEEDED, but without this, Firefox seems to cut the stream off early
		(self as any).stream0 = stream0;

		stream = stream0
			.pipeThrough(
				emitProgressStream(leagueCreationID, sizeInBytes, conditions),
			)
			.pipeThrough(toPolyfillTransform(new TextDecoderStream()))
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
		await iterate(
			transaction.objectStore("teamSeasons"),
			undefined,
			undefined,
			teamSeason => {
				if (teamSeason.season < g.get("season")) {
					transaction.objectStore("teamSeasons").delete(teamSeason.rid);
				}
			},
		);

		transaction.objectStore("draftLotteryResults").clear();

		transaction.objectStore("headToHeads").clear();

		await iterate(
			transaction.objectStore("allStars"),
			undefined,
			undefined,
			allStars => {
				if (allStars.season < g.get("season")) {
					transaction.objectStore("allStars").delete(allStars.season);
				}
			},
		);
	}

	if (options.teamStats) {
		await iterate(
			transaction.objectStore("teamStats"),
			undefined,
			undefined,
			teamStats => {
				if (teamStats.season < g.get("season")) {
					transaction.objectStore("teamStats").delete(teamStats.rid);
				}
			},
		);
	}

	if (options.retiredPlayers) {
		await iterate(
			transaction.objectStore("players").index("tid"),
			PLAYER.RETIRED,
			undefined,
			p => {
				transaction.objectStore("players").delete(p.pid);
			},
		);
	} else if (options.retiredPlayersUnnotable) {
		await iterate(
			transaction.objectStore("players").index("tid"),
			PLAYER.RETIRED,
			undefined,
			p => {
				if (p.awards.length === 0 && !p.statsTids.includes(g.get("userTid"))) {
					transaction.objectStore("players").delete(p.pid);
				}
			},
		);
	}

	const deletePlayerStats = (p: Player) => {
		let updated = false;
		if (p.ratings.length > 0) {
			updated = true;
			p.ratings = [p.ratings.at(-1)!];
		}
		if (p.stats.length > 0) {
			updated = true;
			p.stats = [p.stats.at(-1)];
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
				for (let i = 0; i < p.salaries.length; i++) {
					if (p.salaries[i].season === minSeasonKeep) {
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
		await iterate(
			transaction.objectStore("players"),
			undefined,
			undefined,
			deletePlayerStats,
		);
	} else if (options.playerStatsUnnotable) {
		await iterate(
			transaction.objectStore("players"),
			undefined,
			undefined,
			p => {
				if (p.awards.length === 0 && !p.statsTids.includes(g.get("userTid"))) {
					return deletePlayerStats(p);
				}
			},
		);
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
				deletedExpansionTIDs.push(...event.info.teams.map(t => t.tid));
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
	await beforeView.league(lid, undefined);
};

const draftLottery = async () => {
	const draftLotteryResult = await draft.genOrder();
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
	if (dunk) {
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
	// https://stackoverflow.com/a/63972569/786644
	await Object.getPrototypeOf(async function () {}).constructor(code)();
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
			new Set(
				players
					.map(p => p.ratings)
					.flat()
					.map(pr => pr.season),
			),
		);
	} else {
		seasons = [season];
	}

	const ratings = [...RATINGS, ...extraRatings];

	let stats: string[] = [];

	for (const table of Object.values(PLAYER_STATS_TABLES)) {
		if (table) {
			stats.push(
				...table.stats.filter(stat => {
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
				const array = getCols([col]);
				colNames.push(array[0].title);
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
		...shotLocationsGetCols(stats.map(stat => `stat:${stat}`)),
		"Ovr",
		"Pot",
		...getCols(RATINGS.map(rating => `rating:${rating}`)).map(col => col.title),
		...getCols(
			extraRatings.length
				? ["ovr", "pot"]
						.map(prefix => POSITIONS.map(pos => `rating:${prefix}${pos}`))
						.flat()
				: [],
		).map(col => col.title),
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
				...stats.map(stat => p.stats[stat]),
				p.ratings.ovr,
				p.ratings.pot,
				...RATINGS.map(rating => p.ratings[rating]),
				...(extraRatings.length
					? ["ovrs", "pots"]
							.map(type => POSITIONS.map(pos => p.ratings[type][pos]))
							.flat()
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
		"MP",
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

		for (let i = 0; i < 2; i++) {
			const t = teams[i];
			const t2 = teams[i === 0 ? 1 : 0];

			for (const p of t.players) {
				rows.push([
					gid,
					p.pid,
					p.name,
					p.pos,
					g.get("teamInfoCache")[t.tid]?.abbrev,
					g.get("teamInfoCache")[t2.tid]?.abbrev,
					`${t.pts}-${t2.pts}`,
					t.pts > t2.pts ? "W" : "L",
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
	const leagueName = (await league.getName()).replace(/[^a-z0-9]/gi, "_");

	if (type === "league") {
		const phase = g.get("phase");
		const season = g.get("season");
		const userTid = g.get("userTid");

		let filename = `${GAME_ACRONYM}_${leagueName}_${g.get(
			"season",
		)}_${PHASE_TEXT[phase].replace(/[^a-z0-9]/gi, "_")}`;

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
				} else {
					filename += `_Round_${playoffSeries.currentRound + 1}`;

					// Find the latest playoff series with the user's team in it
					for (const series of playoffSeries.series[rnd]) {
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
		players = players.filter(p => p.tid === PLAYER.UNDRAFTED);
	}

	const data: any = {
		version: idb.league.version,
		startingSeason: season,
		players: players.map(p => ({
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

	const leagueName = (await league.getName()).replace(/[^a-z0-9]/gi, "_");
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
	return face.generate(race);
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

const getLeagueInfo = async (
	options: Parameters<typeof realRosters.getLeagueInfo>[0],
) => {
	return realRosters.getLeagueInfo(options);
};

const getLeagueName = () => {
	return league.getName();
};

const getLeagues = () => {
	return idb.meta.getAll("leagues");
};

const getPlayerGraphStat = (prev: { statType?: string; stat?: string }) => {
	const statType = prev.statType ?? random.choice(statTypes);
	const stats = getStats(statType);
	const stat =
		prev.stat !== undefined && stats.includes(prev.stat)
			? prev.stat
			: random.choice(stats);
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

const getOffers = async (userPids: number[], userDpids: number[]) => {
	// Pick 10 random teams to try (or all teams, if g.get("numActiveTeams") < 10)
	const teams = await idb.cache.teams.getAll();
	const tids = orderBy(
		teams.filter(t => !t.disabled),
		["region", "name", "tid"],
	).map(t => t.tid);
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
			const teams2 = await trade.makeItWork(
				teams,
				true,
				4 + userPids.length + userDpids.length,
			);

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
		active: true,
	});
	const stats = bySport({
		baseball: ["gp", "keyStats", "war"],
		basketball: ["gp", "min", "pts", "trb", "ast", "per"],
		football: ["gp", "keyStats", "av"],
		hockey: ["gp", "keyStats", "ops", "dps", "ps"],
	});

	// Take the pids and dpids in each offer and get the info needed to display the offer
	return Promise.all(
		offers.map(async offerRaw => {
			const tid = offerRaw[1].tid;
			const t = teams.find(t => t.tid === tid);
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
				picks = picks.filter(dp => dpids.includes(dp.dpid));

				return await Promise.all(
					picks.map(async dp => {
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
					p => pids.includes(p.pid) && !isUntradable(p).untradable,
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

const getTradingBlockOffers = async ({
	pids,
	dpids,
}: {
	pids: number[];
	dpids: number[];
}) => {
	const offers = await getOffers(pids, dpids);
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
	players = players.filter(p => p.tid === PLAYER.UNDRAFTED);

	// Handle draft format change in version 33, where PLAYER.UNDRAFTED has multiple draft classes
	if (uploadedFile.version !== undefined && uploadedFile.version >= 33) {
		let filtered = players.filter(
			p =>
				p.draft === undefined ||
				p.draft.year === undefined ||
				p.draft.year === "" ||
				p.draft.year === uploadedSeason,
		);

		if (filtered.length === 0) {
			// Try the next season, in case draft already happened
			filtered = players.filter(
				p =>
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
	leagueFile,
	players,
}: {
	leagueFile: {
		startingSeason: number;
		version?: number;
	};
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
		const p2 = {
			born: p.born,
			college: p.college,
			contract: {
				amount: helpers.localeParseFloat(contractAmount) * 1000,
				exp: parseInt(contractExp),
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
			injuries: p.injuries || [],
			lastName: p.lastName,
			ratings: p.ratings,
			salaries: p.salaries || [],
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

		if (tid === PLAYER.UNDRAFTED) {
			const draftYearInt = parseInt(draftYear);
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
			p2.ratings.season = p2.draft.year;
		} else {
			// How many seasons to adjust player to bring him aligned with current season, as an active player at the selected age
			const seasonOffset2 = currentSeason - (season - seasonOffset);

			p2.born.year += seasonOffset2;
			p2.draft.year += seasonOffset2;

			const adjustAndFilter = (key: "injuries" | "ratings" | "salaries") => {
				for (const row of p2[key]) {
					row.season += seasonOffset2;
				}

				let offset = 0;
				if (key === "injuries" && currentPhase < PHASE.REGULAR_SEASON) {
					// No injuries from current season, if current season has not started yet
					offset = -1;
				} else if (key === "salaries") {
					// Current season salary will be added later
					offset = -1;
				}

				p2[key] = p2[key].filter(
					(row: any) => row.season <= currentSeason + offset,
				);
			};
			adjustAndFilter("injuries");
			adjustAndFilter("ratings");
			adjustAndFilter("salaries");

			player.setContract(p2, p2.contract, tid >= 0);
		}

		const p3 = await player.augmentPartialPlayer(
			p2,
			DEFAULT_LEVEL,
			leagueFile.version,
		);
		await player.updateValues(p3);

		await idb.cache.players.put(p3);
	}

	await toUI("realtimeUpdate", [["playerMovement"]]);
};

const init = async (inputEnv: Env, conditions: Conditions) => {
	Object.assign(env, inputEnv);

	// Kind of hacky, only run this for the first host tab
	if (idb.meta === undefined) {
		checkNaNs();
		idb.meta = await connectMeta();

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

	await iterate(
		idb.league.transaction("players").store,
		undefined,
		undefined,
		pTemp => {
			// Make sure we have latest version of this player
			const p = playersByPid[pTemp.pid] ?? pTemp;

			playerNames.push(formatPlayerRelativesList(p));
		},
	);

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
	} else {
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
			!p.ratings.some(row => row.season === actualSeason)
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
		hockey: ["keyStats"],
	});

	const attrs = ["name", "jerseyNumber", "tid", "age"];
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
	const teams = await idb.getCopies.teamsPlus({
		attrs: ["tid"],
		seasonAttrs: ["cid", "did"],
		season: g.get("season"),
		active: true,
	});

	const newSchedule = season.newSchedule(teams, {
		notify: true,
		conditions,
	});

	await toUI("updateLocal", [
		{
			games: [],
		},
	]);

	await season.setSchedule(newSchedule);
};

const releasePlayer = async ({
	pid,
	justDrafted,
}: {
	pid: number;
	justDrafted: boolean;
}) => {
	const p = await idb.cache.players.get(pid);
	if (!p) {
		return "Player not found";
	}

	if (p.tid !== g.get("userTid")) {
		return "You aren't allowed to do this.";
	}

	await player.release(p, justDrafted);
	await toUI("realtimeUpdate", [["playerMovement"]]);
	await recomputeLocalUITeamOvrs();

	// Purposely after realtimeUpdate, so the UI update happens without waiting for this to complete
	await freeAgents.normalizeContractDemands({
		type: "dummyExpiringContracts",
		pids: [p.pid],
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
		userTids: g.get("userTids").filter(userTid => userTid !== tid),
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
					t2 => t2.tid !== tid,
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

const reorderRosterDrag = async (sortedPids: number[]) => {
	await Promise.all(
		sortedPids.map(async (pid, rosterOrder) => {
			const p = await idb.cache.players.get(pid);
			if (!p) {
				throw new Error("Invalid pid");
			}

			if (p.rosterOrder !== rosterOrder) {
				p.rosterOrder = rosterOrder;
				await idb.cache.players.put(p);
			}
		}),
	);

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

		const prevNumber = t.retiredJerseyNumbers[i].number;
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
	const players = await idb.cache.players.indexGetAll("playersByTid", tid);
	for (const p of players) {
		if (p.stats.length === 0) {
			continue;
		}

		const jerseyNumber = helpers.getJerseyNumber(p);
		if (jerseyNumber === info.number) {
			p.stats.at(-1).jerseyNumber = await player.genJerseyNumber(p);
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

const setPlayerNote = async ({ pid, note }: { pid: number; note: string }) => {
	const p = await idb.getCopy.players(
		{
			pid,
		},
		"noCopyCache",
	);

	if (p) {
		if (note === "") {
			delete p.note;
			delete p.noteBool;
		} else {
			p.note = note;
			p.noteBool = 1;
		}
		await idb.cache.players.put(p);
	} else {
		throw new Error("Invalid pid");
	}

	await toUI("realtimeUpdate", [["playerMovement"]]);
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

	const errorMsg = await contractNegotiation.accept(pid, amount, exp);

	if (errorMsg !== undefined && errorMsg) {
		return errorMsg;
	}
};

const reSignAll = async (players: any[]) => {
	const userTid = g.get("userTid");
	let negotiations = await idb.cache.negotiations.getAll(); // For Multi Team Mode, might have other team's negotiations going on
	negotiations = negotiations.filter(
		negotiation => negotiation.tid === userTid,
	);
	for (const { pid } of negotiations) {
		const p = players.find(p => p.pid === pid);

		if (p && p.mood.user.willing) {
			const errorMsg = await contractNegotiation.accept(
				pid,
				p.mood.user.contractAmount,
				p.contract.exp,
			);

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

const uiUpdateLocal = async (obj: Partial<LocalStateUI>) => {
	await toUI("updateLocal", [obj]);
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

const updateConfsDivs = async ({
	confs,
	divs,
}: {
	confs: { cid: number; name: string }[];
	divs: { cid: number; did: number; name: string }[];
}) => {
	// First some sanity checks to make sure they're consistent
	if (divs.length === 0) {
		throw new Error("No divisions");
	}
	for (const div of divs) {
		const conf = confs.find(c => c.cid === div.cid);
		if (!conf) {
			throw new Error("div has invalid cid");
		}
	}

	await league.setGameAttributes({ confs, divs });

	// Second, update any teams belonging to a deleted division
	await team.ensureValidDivsConfs();

	await toUI("realtimeUpdate", [["gameAttributes"]]);
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
	const gameAttributes: Partial<GameAttributesLeague> = omit(
		settings,
		"repeatSeason",
	);

	const currentRepeatSeasonType = g.get("repeatSeason")?.type ?? "disabled";
	const repeatSeason = settings.repeatSeason;

	if (repeatSeason !== "disabled" && repeatSeason !== currentRepeatSeasonType) {
		if (g.get("phase") < 0 || g.get("phase") > PHASE.DRAFT_LOTTERY) {
			throw new Error("Groundhog Day can only be enabled before the draft");
		}
	}

	// Will be handled in setRepeatSeason, don't pass through a string
	delete gameAttributes.repeatSeason;

	// Check schedule, unless it'd be too slow
	const teams = (await idb.cache.teams.getAll()).filter(t => !t.disabled);
	if (teams.length < TOO_MANY_TEAMS_TOO_SLOW) {
		season.newSchedule(
			teams.map(t => ({
				tid: t.tid,
				seasonAttrs: {
					cid: t.cid,
					did: t.did,
				},
			})),
			{
				notify: true,
				conditions,
			},
		);
	}

	await league.setGameAttributes(gameAttributes);

	if (repeatSeason !== currentRepeatSeasonType) {
		await league.setRepeatSeason(repeatSeason);
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
		} catch (err) {
			console.log(err);
			throw new Error("Invalid JSON in real player photos");
		}
		if (typeof realPlayerPhotos !== "object") {
			throw new Error(
				"Invalid data format in real player photos - input is not an object",
			);
		}
		for (const [key, value] of Object.entries(realPlayerPhotos)) {
			if (typeof value !== "string" && typeof value !== "object") {
				throw new Error(
					`Invalid data format in real player photos - value for "${key}" is not a string or Face object`,
				);
			}
		}
	}
	if (options.realTeamInfo !== "") {
		try {
			realTeamInfo = JSON.parse(options.realTeamInfo);
		} catch (err) {
			console.log(err);
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
					const keyParsed = parseInt(key);
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

	await idb.meta.put(
		"attributes",
		{
			units: options.units,
			fullNames: options.fullNames,
			phaseChangeRedirects: options.phaseChangeRedirects,
		},
		"options",
	);
	await idb.meta.put("attributes", realPlayerPhotos, "realPlayerPhotos");
	await idb.meta.put("attributes", realTeamInfo, "realTeamInfo");
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
		p = await idb.cache.players.get(pid);
	}
	if (!p) {
		p = await idb.league.get("players", pid);
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
			await toUI("realtimeUpdate", [["playerMovement", "watchList"]]);
		}
	}
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
	console.log(teams);
	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
	if (playoffSeries) {
		const { playIns, series } = playoffSeries;
		const byConf = await season.getPlayoffsByConf(g.get("season"));

		const findTeam = (seed: number, cid: number) => {
			// If byConf, we need to find the seed in the same conference, cause multiple teams will have this seed. Otherwise, can just check seed.
			const t = teams.find(t => seed === t.seed && (!byConf || cid === t.cid));

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

		checkMatchups(series[0]);

		if (playIns) {
			checkMatchups(playIns.map(playIn => playIn.slice(0, 2)).flat());
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

const updateTeamInfo = async (
	newTeams: {
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
	}[],
) => {
	const teams = await idb.cache.teams.getAll();

	for (const t of teams) {
		const newTeam = newTeams.find(t2 => t2.tid === t.tid);
		if (!newTeam) {
			throw new Error(`New team not found for tid ${t.tid}`);
		}

		if (newTeam.did !== undefined) {
			const newDiv = g.get("divs").find(div => div.did === newTeam.did);
			if (newDiv) {
				t.did = newDiv.did;
				t.cid = newDiv.cid;
			}
		}

		t.region = newTeam.region;
		t.name = newTeam.name;
		t.abbrev = newTeam.abbrev;

		if (Object.hasOwn(newTeam, "imgURL")) {
			t.imgURL = newTeam.imgURL;
		}
		if (Object.hasOwn(newTeam, "imgURLSmall")) {
			t.imgURLSmall = newTeam.imgURLSmall;
		}

		t.colors = newTeam.colors;
		t.jersey = newTeam.jersey;

		t.pop = helpers.localeParseFloat(newTeam.pop as string);
		t.stadiumCapacity = parseInt(newTeam.stadiumCapacity as string);

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
		if (g.get("phase") < PHASE.PLAYOFFS) {
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
		teamInfoCache: orderBy(newTeams, "tid").map(t => ({
			abbrev: t.abbrev,
			disabled: t.disabled,
			imgURL: t.imgURL,
			imgURLSmall: t.imgURLSmall === "" ? undefined : t.imgURLSmall,
			name: t.name,
			region: t.region,
		})),
	});

	await league.updateMeta();
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
				row => row.number,
			);
			const jerseyNumber = helpers.getJerseyNumber(p);
			if (jerseyNumber && retiredJerseyNumbers.includes(jerseyNumber)) {
				throw new Error(
					`Jersey number "${jerseyNumber}" is retired by the ${t.region} ${t.name}. Either un-retire it at Team > History or pick a new number.`,
				);
			}
		}
	}

	const r = p.ratings.length - 1;

	// Fix draft and ratings season
	if (p.tid === PLAYER.UNDRAFTED) {
		if (p.draft.year < season) {
			p.draft.year = season;
		}

		// Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
		if (p.draft.year === season && g.get("phase") >= PHASE.RESIGN_PLAYERS) {
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
			rel => rel.type === type2 && rel.pid === p.pid,
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
				rel => rel.type === prevRel.type && rel.pid === prevRel.pid,
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
						rel =>
							!(
								rel.type === getInverseType(prevRel.type) &&
								rel.pid === prevPlayer.pid
							),
					);
					await idb.cache.players.put(p2);
				}
			}
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

	// If jersey number is the same as a teammate, edit the teammate's
	const jerseyNumber = helpers.getJerseyNumber(p);
	if (jerseyNumber) {
		const teammates = (
			await idb.cache.players.indexGetAll("playersByTid", p.tid)
		).filter(p2 => p2.pid !== p.pid);
		for (const teammate of teammates) {
			const jerseyNumber2 = helpers.getJerseyNumber(teammate);
			if (jerseyNumber === jerseyNumber2) {
				const newJerseyNumber = await player.genJerseyNumber(teammate);

				if (teammate.stats.length > 0) {
					teammate.stats.at(-1).jerseyNumber = newJerseyNumber;
				} else {
					teammate.jerseyNumber = newJerseyNumber;
				}
			}
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
			game => game.homeTid === -3 && game.awayTid === -3,
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
		numPlayoffByes,
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

export default {
	actions,
	exhibitionGame,
	leagueFileUpload,
	playMenu,
	toolsMenu,
	main: {
		acceptContractNegotiation,
		addTeam,
		allStarDraftAll,
		allStarDraftOne,
		allStarDraftUser,
		allStarDraftReset,
		allStarDraftSetPlayers,
		allStarGameNow,
		autoSortRoster,
		beforeViewLeague,
		beforeViewNonLeague,
		cancelContractNegotiation,
		checkAccount: checkAccount2,
		checkParticipationAchievement,
		clearInjuries,
		clearSavedTrades,
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
		getDefaultInjuries,
		getDefaultNewLeagueSettings,
		getDefaultTragicDeaths,
		getDiamondInfo,
		getLeagueInfo,
		getLeagueName,
		getLeagues,
		getPlayerGraphStat,
		getPlayersCommandPalette,
		getLocal,
		getPlayerBioInfoDefaults,
		getPlayerWatch,
		getProjectedAttendance,
		getRandomCollege,
		getRandomCountry,
		getRandomJerseyNumber,
		getRandomName,
		getRandomRatings,
		getRandomTeams,
		getSavedTrade,
		getTradingBlockOffers,
		ping,
		handleUploadedDraftClass,
		idbCacheFlush,
		importPlayers,
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
		reorderRosterDrag,
		resetPlayingTime,
		retiredJerseyNumberDelete,
		retiredJerseyNumberUpsert,
		runBefore,
		setForceWin,
		setForceWinAll,
		setGOATFormula,
		setLocal,
		setPlayerNote,
		setSavedTrade,
		sign,
		updateExpansionDraftSetup,
		advanceToPlayerProtection,
		autoProtect,
		cancelExpansionDraft,
		updateProtectedPlayers,
		startExpansionDraft,
		startFantasyDraft,
		switchTeam,
		threeSimNext,
		toggleTradeDeadline,
		tradeCounterOffer,
		uiUpdateLocal,
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
		updatePlayingTime,
		updatePlayoffTeams,
		updateTeamInfo,
		updateTrade,
		upsertCustomizedPlayer,
		validatePointsFormula,
		validatePlayoffSettings,
	},
};
