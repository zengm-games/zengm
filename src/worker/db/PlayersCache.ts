import type { Player } from "../../common/types.ts";
import { idb } from "./index.ts";

// Use this when we're getting players from disk in a loop and there could be many repeats, like teamRecords and historyAll. Only use this transiently - after the loop, it's done, could get out of date!
export class PlayersCache {
	private cache = new Map<number, Player>();

	async get(pid: number) {
		const p = this.cache.get(pid);
		if (p) {
			return p;
		}

		const p2 = await idb.getCopy.players({ pid }, "noCopyCache");
		if (p2) {
			this.cache.set(pid, p2);
			return p2;
		}
	}
}
