import { g } from "../../util";
import type { PhaseReturn } from "../../../common/types";
import { league, freeAgents } from "..";
import { PHASE } from "../../../common";

// By the time this is called, advanceToPlayerProtection has done all the hard work. Might want to move some of that here eventually, the hard part is that it does validation and sends errors back to the UI, so might as well write to the database right after that.
const newPhaseExpansionDraft = async (): Promise<PhaseReturn> => {
	await league.setGameAttributes({
		nextPhase: g.get("phase"),
	});

	// If this is before the season, make sure to call ensureEnoughPlayers, otherwise might not be enough. If it's after the season, this is not necessary because it'll be called before free agency, which will be more accurate cause it'll take into account retirement and the draft.
	if (g.get("phase") <= PHASE.PLAYOFFS) {
		await freeAgents.ensureEnoughPlayers();
	}

	return {};
};

export default newPhaseExpansionDraft;
