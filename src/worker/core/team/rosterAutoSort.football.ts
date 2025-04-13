import { idb } from "../../db/index.ts";
import genDepth from "./genDepth.football.ts";
import type { Position } from "../../../common/types.football.ts";

const rosterAutoSort = async (
	tid: number,
	onlyNewPlayers?: boolean,
	pos?: Position,
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
			QB: number[];
			RB: number[];
			WR: number[];
			TE: number[];
			OL: number[];
			DL: number[];
			LB: number[];
			CB: number[];
			S: number[];
			K: number[];
			P: number[];
			KR: number[];
			PR: number[];
		},
		onlyNewPlayers,
		pos,
	);

	await idb.cache.teams.put(t);
};

export default rosterAutoSort;
