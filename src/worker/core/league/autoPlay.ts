import { PHASE } from "../../../common";
import {
	draft,
	freeAgents,
	game,
	phase,
	season,
	expansionDraft,
	team,
} from "..";
import { g, random } from "../../util";
import type { Conditions } from "../../../common/types"; // Depending on phase, initiate action that will lead to the next phase
import { idb } from "../../db";

const autoPlay = async (conditions: Conditions = {}) => {
	let currentPhase = g.get("phase");

	// No newPhase call is triggered after expansion draft, so this check comes first
	if (currentPhase === PHASE.EXPANSION_DRAFT) {
		if (g.get("expansionDraft").phase === "protection") {
			await expansionDraft.start();
		}
		if (g.get("expansionDraft").phase === "draft") {
			await draft.runPicks("untilEnd", conditions);
		}

		currentPhase = g.get("phase");
	}

	// If game over and user's team is disabled, need to pick a new team or there will be errors
	if (g.get("gameOver")) {
		const t = await idb.cache.teams.get(g.get("userTid"));
		if (!t || t.disabled) {
			// If multi team mode was enabled, a new team would have already been picked in team.disable(). So go with a random team here.
			const teams = (await idb.cache.teams.getAll()).filter(t => !t.disabled);
			if (teams.length === 0) {
				throw new Error("No active teams");
			}
			await team.switchTo(random.choice(teams).tid);
		}
	}

	if (currentPhase === PHASE.PRESEASON) {
		await phase.newPhase(PHASE.REGULAR_SEASON, conditions);
	} else if (
		currentPhase === PHASE.REGULAR_SEASON ||
		currentPhase === PHASE.AFTER_TRADE_DEADLINE
	) {
		const numDays = await season.getDaysLeftSchedule();
		await game.play(numDays, conditions);
	} else if (currentPhase === PHASE.PLAYOFFS) {
		await game.play(100, conditions);
	} else if (currentPhase === PHASE.DRAFT_LOTTERY) {
		if (g.get("repeatSeason")) {
			await phase.newPhase(PHASE.PRESEASON, conditions);
		} else {
			await phase.newPhase(PHASE.DRAFT, conditions);
		}
	} else if (currentPhase === PHASE.DRAFT) {
		if (g.get("draftType") === "freeAgents") {
			await phase.newPhase(PHASE.AFTER_DRAFT, conditions);
		} else {
			await draft.runPicks("untilEnd", conditions);
		}
	} else if (currentPhase === PHASE.AFTER_DRAFT) {
		await phase.newPhase(PHASE.RESIGN_PLAYERS, conditions);
	} else if (currentPhase === PHASE.RESIGN_PLAYERS) {
		await phase.newPhase(PHASE.FREE_AGENCY, conditions);
	} else if (currentPhase === PHASE.FREE_AGENCY) {
		// Purposely call without await, to break up the promise chain. Otherwise (at least in Chrome 85) causes a memory leak after playing like 50 seasons.
		freeAgents.play(g.get("daysLeft"), conditions);
	} else {
		throw new Error(`Unknown phase: ${currentPhase}`);
	}
};

export default autoPlay;
