import { g, helpers } from "../../util/index.ts";
import { league } from "../index.ts";
import { PHASE } from "../../../common/index.ts";

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
