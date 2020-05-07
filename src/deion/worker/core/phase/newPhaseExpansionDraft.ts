import { g } from "../../util";
import type { PhaseReturn } from "../../../common/types";
import { league } from "..";

// By the time this is called, advanceToPlayerProtection has done all the hard work. Might want to move some of that here eventually, the hard part is that it does validation and sends errors back to the UI, so might as well write to the database right after that.
const newPhaseExpansionDraft = async (): Promise<PhaseReturn> => {
	await league.setGameAttributes({
		nextPhase: g.get("phase"),
	});

	return [undefined, []];
};

export default newPhaseExpansionDraft;
