import { PHASE } from "../../../common";
import {
	draft,
	freeAgents,
	game,
	phase,
	season,
	expansionDraft,
	league,
	team,
} from "..";
import { g, random } from "../../util";
import type { Conditions } from "../../../common/types"; // Depending on phase, initiate action that will lead to the next phase
import { idb } from "../../db";

const autoPlay = async (conditions: Conditions = {}) => {
	// No newPhase call is triggered after expansion draft, so this check comes first
	if (g.get("phase") === PHASE.EXPANSION_DRAFT) {
		if (g.get("expansionDraft").phase === "protection") {
			await expansionDraft.start();
		}
		if (g.get("expansionDraft").phase === "draft") {
			await draft.runPicks(false, conditions);
		}
	}

	// If game over and user's team is disabled, need to pick a new team or there will be errors
	if (g.get("gameOver")) {
		const t = await idb.cache.teams.get(g.get("userTid"));
		if (t.disabled) {
			// If multi team mode was enabled, a new team would have already been picked in team.disable(). So go with a random team here.
			const teams = (await idb.cache.teams.getAll()).filter(t => !t.disabled);
			if (teams.length === 0) {
				throw new Error("No active teams");
			}
			await team.switchTo(random.choice(teams).tid);
		}
	}

	if (g.get("phase") === PHASE.PRESEASON) {
		await phase.newPhase(PHASE.REGULAR_SEASON, conditions);
	} else if (g.get("phase") === PHASE.REGULAR_SEASON) {
		const numDays = await season.getDaysLeftSchedule();
		await game.play(numDays, conditions);
	} else if (g.get("phase") === PHASE.PLAYOFFS) {
		await game.play(100, conditions);
	} else if (g.get("phase") === PHASE.DRAFT_LOTTERY) {
		await phase.newPhase(PHASE.DRAFT, conditions);
	} else if (g.get("phase") === PHASE.DRAFT) {
		await draft.runPicks(false, conditions);
	} else if (g.get("phase") === PHASE.AFTER_DRAFT) {
		await phase.newPhase(PHASE.RESIGN_PLAYERS, conditions);
	} else if (g.get("phase") === PHASE.RESIGN_PLAYERS) {
		await phase.newPhase(PHASE.FREE_AGENCY, conditions);
	} else if (g.get("phase") === PHASE.FREE_AGENCY) {
		await freeAgents.play(g.get("daysLeft"), conditions);
	} else {
		throw new Error(`Unknown phase: ${g.get("phase")}`);
	}
};

export default autoPlay;
