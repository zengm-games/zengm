import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import { PHASE } from "../../../common/index.ts";
import { orderBy } from "../../../common/utils.ts";

const autoProtect = async (tid: number): Promise<number[]> => {
	const expansionDraft = g.get("expansionDraft");
	if (
		g.get("phase") !== PHASE.EXPANSION_DRAFT ||
		expansionDraft.phase !== "protection"
	) {
		throw new Error("Invalid expansion draft phase");
	}

	const players = await idb.cache.players.indexGetAll("playersByTid", tid);
	const maxNumCanProtext = Math.min(
		expansionDraft.numProtectedPlayers,
		players.length - expansionDraft.numPerTeam,
	);
	const pids = orderBy(players, "valueFuzz", "desc")
		.slice(0, maxNumCanProtext)
		.map((p) => p.pid);
	return pids;
};

export default autoProtect;
