import { PHASE } from "../../../common/constants.ts";
import { league, phase, trade } from "../index.ts";
import autoSign from "./autoSign.ts";
import decreaseDemands from "./decreaseDemands.ts";
import {
	g,
	sim,
	updatePlayMenu,
	updateStatus,
	toUI,
	helpers,
} from "../../util/index.ts";
import type { SimRun } from "../../util/sim.ts";
import type { Conditions } from "../../../common/types.ts";
import { recomputeLocalUITeamOvrs } from "../../util/recomputeLocalUITeamOvrs.ts";

// Simulates one day, then calls itself for the next day, until run is finished
async function playDays(run: SimRun, numDays: number, conditions: Conditions) {
	// This is called when there are no more days to play, either due to the user's request (e.g. 1 week) elapsing or at the end of free agency.
	const cbNoDays = async () => {
		await run.finish();
		await updatePlayMenu();

		// Check to see if free agency is over
		if (g.get("daysLeft") <= 0) {
			await phase.newPhase(PHASE.PRESEASON, conditions);
		}
	};

	// This simulates a day, including game simulation and any other bookkeeping that needs to be done
	const cbRunDay = async () => {
		// This is called if there are remaining days to simulate
		const cbYetAnother = async () => {
			await decreaseDemands();
			await autoSign();
			await league.setGameAttributes({
				daysLeft: g.get("daysLeft") - 1,
			});

			if (g.get("daysLeft") > 0 && numDays > 0) {
				await toUI("realtimeUpdate", [["playerMovement"]]);
				await recomputeLocalUITeamOvrs();
				await updateStatus(helpers.daysLeft(true));
				await trade.betweenAiTeams();
				await playDays(run, numDays - 1, conditions);
			} else {
				await cbNoDays();
			}
		};

		// Keep playing, unless a stop was requested
		if (numDays > 0 && run.shouldContinue()) {
			await cbYetAnother();
		} else {
			// If this is the last day, update play menu
			await cbNoDays();
		}
	};

	await cbRunDay();
}

/**
 * Simulates one or more days of free agency, if no other sim is running.
 *
 * @memberOf core.freeAgents
 * @param {number} numDays An integer representing the number of days to be simulated. If numDays is larger than the number of days remaining, then all of free agency will be simulated up until the preseason starts.
 */
const play = async (numDays: number, conditions: Conditions) => {
	await sim.run(async (run) => {
		await updatePlayMenu();
		await playDays(run, numDays, conditions);
	});
};

export default play;
