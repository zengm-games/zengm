import { draft, league } from "..";
import { idb } from "../../db";
import { g } from "../../util";
import type { PhaseReturn } from "../../../common/types";

const newPhaseAfterDraft = async (): Promise<PhaseReturn> => {
	await draft.genPicks({
		afterDraft: true,
	});

	// Delete any old draft picks
	const draftPicks = await idb.cache.draftPicks.getAll();
	for (const dp of draftPicks) {
		if (typeof dp.season !== "number" || dp.season <= g.get("season")) {
			await idb.cache.draftPicks.delete(dp.dpid);
		}
	}

	// Already set in afterPicks, but do again just to be sure
	await league.setGameAttributes({
		numDraftPicksCurrent: undefined,
	});

	return {
		updateEvents: ["playerMovement"],
	};
};

export default newPhaseAfterDraft;
