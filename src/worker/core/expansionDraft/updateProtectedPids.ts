import { g, helpers } from "../../util";
import { league } from "..";
import { PHASE } from "../../../common";

const updateProtectedPids = async (tid: number, protectedPids: number[]) => {
	const expansionDraft = helpers.deepCopy(g.get("expansionDraft"));
	if (
		g.get("phase") !== PHASE.EXPANSION_DRAFT ||
		expansionDraft.phase !== "protection"
	) {
		throw new Error("Invalid expansion draft phase");
	}

	expansionDraft.protectedPids[tid] = protectedPids;

	await league.setGameAttributes({ expansionDraft });
};

export default updateProtectedPids;
