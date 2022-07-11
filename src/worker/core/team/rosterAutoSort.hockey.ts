import { idb } from "../../db";
import genDepth from "./genDepth.hockey";

const rosterAutoSort = async (
	tid: number,
	onlyNewPlayers?: boolean,
	pos?: "F" | "D" | "G",
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
			F: number[];
			D: number[];
			G: number[];
		},
		onlyNewPlayers,
		pos,
	);

	await idb.cache.teams.put(t);
};

export default rosterAutoSort;
