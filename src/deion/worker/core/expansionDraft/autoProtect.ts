import { idb } from "../../db";
import orderBy from "lodash/orderBy";
import { g } from "../../util";

const autoProtect = async (tid: number): Promise<number[]> => {
	const expansionDraft = g.get("expansionDraft");
	if (expansionDraft.phase !== "protection") {
		throw new Error("Invalid expansion draft phase");
	}

	const players = await idb.cache.players.indexGetAll("playersByTid", tid);
	const pids = orderBy(players, "valueFuzz", "desc")
		.slice(0, expansionDraft.numProtectedPlayers)
		.map(p => p.pid);
	return pids;
};

export default autoProtect;
