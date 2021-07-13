import { idb } from "../../db";
import orderBy from "lodash-es/orderBy";
import { g } from "../../util";
import { PHASE } from "../../../common";

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
		.map(p => p.pid);
	return pids;
};

export default autoProtect;
