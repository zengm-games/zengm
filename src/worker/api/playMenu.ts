import { bySport, isSport, PHASE } from "../../common";
import type { Conditions, PlayoffSeries } from "../../common/types";
import { season, game, phase, freeAgents } from "../core";
import { idb } from "../db";
import {
	g,
	updateStatus,
	local,
	helpers,
	updatePlayMenu,
	lock,
	toUI,
} from "../util";
import { runDraft } from "./actions";

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
	if (playoffSeries.playIns.some(playIn => playIn[0].home.pts === undefined)) {
		numDays = 2;
	} else if (
		playoffSeries.playIns.some(
			playIn => playIn.length > 2 && playIn[2]?.home.pts === undefined,
		)
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

const playMenu = {
	stop: async () => {
		await playStop();
	},
	day: async (param: unknown, conditions: Conditions) => {
		await playAmount("day", conditions);
	},
	week: async (param: unknown, conditions: Conditions) => {
		await playAmount("week", conditions);
	},
	month: async (param: unknown, conditions: Conditions) => {
		await playAmount("month", conditions);
	},
	untilAllStarGame: async (param: unknown, conditions: Conditions) => {
		if (g.get("phase") < PHASE.PLAYOFFS) {
			await updateStatus("Playing...");
			const numDays = await season.getDaysLeftSchedule("allStarGame");
			game.play(numDays, conditions);
		}
	},
	untilTradeDeadline: async (param: unknown, conditions: Conditions) => {
		if (g.get("phase") < PHASE.PLAYOFFS) {
			await updateStatus("Playing...");
			const numDays = await season.getDaysLeftSchedule("tradeDeadline");
			game.play(numDays, conditions);
		}
	},
	untilPlayoffs: async (param: unknown, conditions: Conditions) => {
		if (g.get("phase") < PHASE.PLAYOFFS) {
			await updateStatus("Playing...");
			const numDays = await season.getDaysLeftSchedule();
			game.play(numDays, conditions);
		}
	},
	untilEndOfRound: async (param: unknown, conditions: Conditions) => {
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
	untilEndOfPlayIn: async (param: unknown, conditions: Conditions) => {
		if (g.get("phase") === PHASE.PLAYOFFS) {
			await updateStatus("Playing...");

			const numDays = await getNumDaysPlayIn();

			// local.playingUntilEndOfPlayIn is not needed because we always know how many games to play
			game.play(numDays, conditions);
		}
	},
	throughPlayoffs: async (param: unknown, conditions: Conditions) => {
		if (g.get("phase") === PHASE.PLAYOFFS) {
			await updateStatus("Playing..."); // For quick UI updating, before await

			const numDays = await getNumDaysPlayoffs();
			game.play(numDays, conditions);
		}
	},
	untilDraft: async (param: unknown, conditions: Conditions) => {
		if (g.get("phase") === PHASE.DRAFT_LOTTERY) {
			await phase.newPhase(PHASE.DRAFT, conditions);
		}
	},
	onePick: async (param: unknown, conditions: Conditions) => {
		await runDraft({ type: "onePick" }, conditions);
	},
	untilYourNextPick: async (param: unknown, conditions: Conditions) => {
		await runDraft({ type: "untilYourNextPick" }, conditions);
	},
	untilEnd: async (param: unknown, conditions: Conditions) => {
		await runDraft({ type: "untilEnd" }, conditions);
	},
	untilResignPlayers: async (param: unknown, conditions: Conditions) => {
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
	untilFreeAgency: async (param: unknown, conditions: Conditions) => {
		if (g.get("phase") === PHASE.RESIGN_PLAYERS) {
			const negotiations = await idb.cache.negotiations.getAll();
			const numRemaining = negotiations.length; // Show warning dialog only if there are players remaining un-re-signed

			let proceed = true;

			if (numRemaining > 0) {
				// This function always returns a boolean if no defaultValue is supplied, but couldn't figure out how to get it to work correctly with TypeScript.
				proceed = (await toUI(
					"confirm",
					[
						`Are you sure you want to proceed to free agency while ${numRemaining} of your players remain unsigned? If you do not re-sign them before free agency begins, they will be free to sign with any team${
							g.get("salaryCapType") === "soft"
								? ""
								: ", and you won't be able to go over the salary cap to sign them"
						}.`,
						{
							okText: "Proceed",
						},
					],
					conditions,
				)) as unknown as boolean;
			}

			if (proceed) {
				await phase.newPhase(PHASE.FREE_AGENCY, conditions);
				await updateStatus(helpers.daysLeft(true));
			}
		}
	},
	untilPreseason: async (param: unknown, conditions: Conditions) => {
		await playAmount("untilPreseason", conditions);
	},
	untilRegularSeason: async (param: unknown, conditions: Conditions) => {
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

export default playMenu;
