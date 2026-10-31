import { PHASE, PLAYER } from "../../../common/constants.ts";
import type { Player } from "../../../common/types.ts";
import g from "../../util/g.ts";

export const canBeDrafted = (p: Player) => {
	if (g.get("phase") === PHASE.FANTASY_DRAFT) {
		return p.tid === PLAYER.UNDRAFTED;
	}

	const expansionDraft = g.get("expansionDraft");
	if (expansionDraft.phase === "draft") {
		return expansionDraft.availablePids.includes(p.pid);
	}

	return p.tid === PLAYER.UNDRAFTED && p.draft.year === g.get("season");
};
