import { bySport, isSport, PHASE } from "../../common";
import {
	contractNegotiation,
	draft,
	freeAgents,
	game,
	league,
	phase,
	season,
	trade,
} from "../core";
import { idb, reset } from "../db";
import {
	g,
	helpers,
	local,
	lock,
	logEvent,
	toUI,
	updatePlayMenu,
	updateStatus,
} from "../util";
import type { Conditions, TradeTeams, PlayoffSeries } from "../../common/types";

const negotiate = async (pid: number, conditions: Conditions) => {
	// If there is no active negotiation with this pid, create it
	const negotiation = await idb.cache.negotiations.get(pid);

	if (!negotiation) {
		const errorMsg = await contractNegotiation.create(pid, false);

		if (errorMsg !== undefined && errorMsg) {
			logEvent(
				{
					type: "error",
					text: errorMsg,
					saveToDb: false,
				},
				conditions,
			);
		} else {
			toUI(
				"realtimeUpdate",
				[[], helpers.leagueUrl(["negotiation", pid])],
				conditions,
			);
		}
	} else {
		toUI(
			"realtimeUpdate",
			[[], helpers.leagueUrl(["negotiation", pid])],
			conditions,
		);
	}
};

type TradeForOptions = {
	dpid?: number;
	pid?: number;
	otherDpids?: number[];
	otherPids?: number[];
	tid?: number;
	userDpids?: number[];
	userPids?: number[];
};

const tradeFor = async (arg: TradeForOptions, conditions: Conditions) => {
	let teams: TradeTeams | undefined;

	if (arg.pid !== undefined) {
		const p = await idb.cache.players.get(arg.pid);

		if (!p || p.tid < 0) {
			return;
		}

		// Start new trade for a single player, like a Trade For button
		teams = [
			{
				tid: g.get("userTid"),
				pids: [],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
			{
				tid: p.tid,
				pids: [arg.pid],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
		];
	} else if (arg.dpid !== undefined) {
		const dp = await idb.cache.draftPicks.get(arg.dpid);

		if (!dp) {
			return;
		}

		// Start new trade for a single player, like a Trade For button
		teams = [
			{
				tid: g.get("userTid"),
				pids: [],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
			{
				tid: dp.tid,
				pids: [],
				pidsExcluded: [],
				dpids: [arg.dpid],
				dpidsExcluded: [],
			},
		];
	} else if (
		arg.userPids &&
		arg.userDpids &&
		arg.otherPids &&
		arg.otherDpids &&
		arg.tid !== undefined
	) {
		// Start a new trade with everything specified, from the trading block
		teams = [
			{
				tid: g.get("userTid"),
				pids: arg.userPids,
				pidsExcluded: [],
				dpids: arg.userDpids,
				dpidsExcluded: [],
			},
			{
				tid: arg.tid,
				pids: arg.otherPids,
				pidsExcluded: [],
				dpids: arg.otherDpids,
				dpidsExcluded: [],
			},
		];
	} else if (arg.tid !== undefined) {
		// Start trade with team, like from League Finances
		teams = [
			{
				tid: g.get("userTid"),
				pids: [],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
			{
				tid: arg.tid,
				pids: [],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
		];
	}

	// Start a new trade based on a list of pids and dpids, like from the trading block
	if (teams) {
		await trade.create(teams);
		toUI("realtimeUpdate", [[], helpers.leagueUrl(["trade"])], conditions);
	}
};

const addToTradingBlock = async (pid: number, conditions: Conditions) => {
	toUI(
		"realtimeUpdate",
		[[], helpers.leagueUrl(["trading_block"]), { pid }],
		conditions,
	);
};

const getNumDaysThisRound = (playoffSeries: PlayoffSeries) => {
	let numDaysThisRound = 0;

	if (playoffSeries.currentRound === -1) {
		return 1;
	}

	if (playoffSeries.series.length > 0) {
		for (const series of playoffSeries.series[playoffSeries.currentRound]) {
			const num = series.away
				? g.get("numGamesPlayoffSeries", "current")[
						playoffSeries.currentRound
				  ] -
				  series.home.won -
				  series.away.won
				: 0;

			if (num > numDaysThisRound) {
				numDaysThisRound = num;
			}
		}
	}

	return numDaysThisRound;
};

const getNumDaysPlayIn = async () => {
	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
	if (!playoffSeries) {
		throw new Error("playoffSeries not found");
	}

	if (playoffSeries.currentRound > -1 || !playoffSeries.playIns) {
		return 0;
	}

	let numDays = 0;
	if (playoffSeries.playIns[0][0].home.pts === undefined) {
		numDays = 2;
	} else if (
		playoffSeries.playIns[0].length > 2 &&
		playoffSeries.playIns[0][2]?.home.pts === undefined
	) {
		numDays = 1;
	}

	return numDays;
};

const getNumDaysPlayoffs = async () => {
	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
	if (!playoffSeries) {
		throw new Error("playoffSeries not found");
	}

	// Max 7 days per round that hasn't started yet
	let numDaysFutureRounds = 0;

	for (
		let i = playoffSeries.currentRound + 1;
		i < g.get("numGamesPlayoffSeries", "current").length;
		i++
	) {
		numDaysFutureRounds += g.get("numGamesPlayoffSeries", "current")[i];
	}

	const numDaysPlayIn = await getNumDaysPlayIn();

	return (
		numDaysPlayIn + numDaysFutureRounds + getNumDaysThisRound(playoffSeries)
	);
};

const playAmount = async (
	amount: "day" | "week" | "month" | "untilPreseason",
	conditions: Conditions,
) => {
	let numDays;

	if (amount === "day") {
		numDays = 1;
	} else if (amount === "week") {
		numDays =
			!isSport("football") || g.get("phase") === PHASE.FREE_AGENCY ? 7 : 1;
	} else if (amount === "month") {
		numDays = bySport({
			football: 4,
			default: 30,
		});
	} else if (amount === "untilPreseason") {
		numDays = g.get("daysLeft");
	} else {
		throw new Error(`Invalid amount: ${amount}`);
	}

	if (g.get("phase") <= PHASE.PLAYOFFS) {
		const numDaysRemaining =
			g.get("phase") === PHASE.PLAYOFFS
				? await getNumDaysPlayoffs()
				: await season.getDaysLeftSchedule();

		if (numDaysRemaining < numDays) {
			numDays = numDaysRemaining;
		}

		await updateStatus("Playing..."); // For quick UI updating, before game.play

		await game.play(numDays, conditions);
	} else if (g.get("phase") === PHASE.FREE_AGENCY) {
		if (numDays > g.get("daysLeft")) {
			numDays = g.get("daysLeft");
		}

		await freeAgents.play(numDays, conditions);
	} else if (g.get("phase") === PHASE.DRAFT_LOTTERY && g.get("repeatSeason")) {
		await phase.newPhase(PHASE.PRESEASON, conditions);
	}
};

const playStop = async () => {
	await lock.set("stopGameSim", true);

	if (g.get("phase") !== PHASE.FREE_AGENCY) {
		// This is needed because we can't be sure if core.game.play will be called again
		await updateStatus("Idle");
	}

	await lock.set("gameSim", false);
	await updatePlayMenu();
};

const runDraft = async (
	type: "onePick" | "untilYourNextPick" | "untilEnd",
	conditions: Conditions,
) => {
	if (
		g.get("phase") === PHASE.DRAFT ||
		g.get("phase") === PHASE.FANTASY_DRAFT ||
		g.get("phase") === PHASE.EXPANSION_DRAFT
	) {
		await updateStatus("Draft in progress...");
		await draft.runPicks(type, conditions);
		const draftPicks = await draft.getOrder();

		if (draftPicks.length === 0) {
			await updateStatus("Idle");
		}
	}
};

const playMenu = {
	stop: async () => {
		await playStop();
	},
	day: async (conditions: Conditions) => {
		await playAmount("day", conditions);
	},
	week: async (conditions: Conditions) => {
		await playAmount("week", conditions);
	},
	month: async (conditions: Conditions) => {
		await playAmount("month", conditions);
	},
	untilAllStarGame: async (conditions: Conditions) => {
		if (g.get("phase") < PHASE.PLAYOFFS) {
			await updateStatus("Playing...");
			const numDays = await season.getDaysLeftSchedule("allStarGame");
			game.play(numDays, conditions);
		}
	},
	untilTradeDeadline: async (conditions: Conditions) => {
		if (g.get("phase") < PHASE.PLAYOFFS) {
			await updateStatus("Playing...");
			const numDays = await season.getDaysLeftSchedule("tradeDeadline");
			game.play(numDays, conditions);
		}
	},
	untilPlayoffs: async (conditions: Conditions) => {
		if (g.get("phase") < PHASE.PLAYOFFS) {
			await updateStatus("Playing...");
			const numDays = await season.getDaysLeftSchedule();
			game.play(numDays, conditions);
		}
	},
	untilEndOfRound: async (conditions: Conditions) => {
		if (g.get("phase") === PHASE.PLAYOFFS) {
			await updateStatus("Playing...");
			const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
			if (!playoffSeries) {
				throw new Error("playoffSeries not found");
			}
			local.playingUntilEndOfRound = true;
			game.play(getNumDaysThisRound(playoffSeries), conditions);
		}
	},
	untilEndOfPlayIn: async (conditions: Conditions) => {
		if (g.get("phase") === PHASE.PLAYOFFS) {
			await updateStatus("Playing...");

			const numDays = await getNumDaysPlayIn();

			// local.playingUntilEndOfPlayIn is not needed because we always know how many games to play
			game.play(numDays, conditions);
		}
	},
	throughPlayoffs: async (conditions: Conditions) => {
		if (g.get("phase") === PHASE.PLAYOFFS) {
			await updateStatus("Playing..."); // For quick UI updating, before await

			const numDays = await getNumDaysPlayoffs();
			game.play(numDays, conditions);
		}
	},
	untilDraft: async (conditions: Conditions) => {
		if (g.get("phase") === PHASE.DRAFT_LOTTERY) {
			await phase.newPhase(PHASE.DRAFT, conditions);
		}
	},
	onePick: async (conditions: Conditions) => {
		await runDraft("onePick", conditions);
	},
	untilYourNextPick: async (conditions: Conditions) => {
		await runDraft("untilYourNextPick", conditions);
	},
	untilEnd: async (conditions: Conditions) => {
		await runDraft("untilEnd", conditions);
	},
	untilResignPlayers: async (conditions: Conditions) => {
		if (
			g.get("draftType") === "freeAgents" &&
			g.get("phase") === PHASE.DRAFT_LOTTERY
		) {
			await phase.newPhase(PHASE.DRAFT, conditions);
			await phase.newPhase(PHASE.AFTER_DRAFT, conditions);
		}
		if (g.get("phase") === PHASE.AFTER_DRAFT) {
			await phase.newPhase(PHASE.RESIGN_PLAYERS, conditions);
		}
	},
	untilFreeAgency: async (conditions: Conditions) => {
		if (g.get("phase") === PHASE.RESIGN_PLAYERS) {
			const negotiations = await idb.cache.negotiations.getAll();
			const numRemaining = negotiations.length; // Show warning dialog only if there are players remaining un-re-signed

			let proceed = true;

			if (numRemaining > 0) {
				// This function always returns a boolean if no defaultValue is supplied, but couldn't figure out how to get it to work correctly with TypeScript.
				// @ts-ignore
				proceed = await toUI(
					"confirm",
					[
						`Are you sure you want to proceed to free agency while ${numRemaining} of your players remain unsigned? If you do not re-sign them before free agency begins, they will be free to sign with any team${
							g.get("hardCap")
								? ""
								: ", and you won't be able to go over the salary cap to sign them"
						}.`,
						{
							okText: "Proceed",
						},
					],
					conditions,
				);
			}

			if (proceed) {
				await phase.newPhase(PHASE.FREE_AGENCY, conditions);
				await updateStatus(helpers.daysLeft(true));
			}
		}
	},
	untilPreseason: async (conditions: Conditions) => {
		await playAmount("untilPreseason", conditions);
	},
	untilRegularSeason: async (conditions: Conditions) => {
		if (g.get("phase") === PHASE.PRESEASON) {
			await phase.newPhase(PHASE.REGULAR_SEASON, conditions);
		}
	},
	stopAuto: async () => {
		local.autoPlayUntil = undefined;
		updatePlayMenu();
		await playStop();
	},
};
const toolsMenu = {
	autoPlaySeasons: (conditions: Conditions) => {
		return league.initAutoPlay(conditions);
	},
	skipToPlayoffs: async (conditions: Conditions) => {
		await phase.newPhase(PHASE.PLAYOFFS, conditions);
	},
	skipToBeforeDraft: async (conditions: Conditions) => {
		await phase.newPhase(PHASE.DRAFT_LOTTERY, conditions);
	},
	skipToAfterDraft: async (conditions: Conditions) => {
		await phase.newPhase(PHASE.AFTER_DRAFT, conditions);
	},
	skipToPreseason: async (conditions: Conditions) => {
		await phase.newPhase(PHASE.PRESEASON, conditions);
	},
	resetDb: async (conditions: Conditions) => {
		const response = await toUI("confirmDeleteAllLeagues", [], conditions);
		console.log("response", response);

		if (response) {
			await reset(response);
		}

		return response;
	},
};

const liveGame = async (gid: number, conditions: Conditions) => {
	await toUI(
		"realtimeUpdate",
		[
			[],
			helpers.leagueUrl(["live_game"]),
			{
				fromAction: true,
			},
		],
		conditions,
	);
	game.play(1, conditions, true, gid);
};

const simGame = async (gid: number, conditions: Conditions) => {
	await game.play(1, conditions, true, gid);
};

const simToGame = async (gid: number, conditions: Conditions) => {
	const numDays = await season.getDaysLeftSchedule(gid);
	await updateStatus("Playing..."); // For quick UI updating, before game.play
	await game.play(numDays, conditions);
};

export default {
	addToTradingBlock,
	liveGame,
	negotiate,
	playMenu,
	simGame,
	simToGame,
	toolsMenu,
	tradeFor,
};
