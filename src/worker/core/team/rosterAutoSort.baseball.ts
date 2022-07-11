import { idb } from "../../db";
import genDepth from "./genDepth.baseball";

const rosterAutoSort = async (
	tid: number,
	onlyNewPlayers?: boolean,
	pos?: "L" | "LP" | "D" | "DP" | "P",
) => {
	const t = await idb.cache.teams.get(tid);
	if (!t) {
		throw new Error("Invalid tid");
	}

	const playersFromCache = await idb.cache.players.indexGetAll(
		"playersByTid",
		tid,
	);

	t.depth = await genDepth(
		playersFromCache,
		t.depth as {
			L: number[];
			LP: number[];
			D: number[];
			DP: number[];
			P: number[];
		},
		onlyNewPlayers,
		pos,
	);

	await idb.cache.teams.put(t);
};

export default rosterAutoSort;
