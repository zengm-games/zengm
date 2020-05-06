import { PHASE } from "../../../common";
import { draft, freeAgents, game, phase, season, expansionDraft } from "..";
import { g } from "../../util";
import type { Conditions } from "../../../common/types"; // Depending on phase, initiate action that will lead to the next phase

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
