import { idb } from "../db/index.ts";
import type { Player } from "../../common/types.ts";

const advStatsSave = async (
	players: any[],
	playersRaw: Player[],
	updatedStats: Record<string, number[] | number[][]>,
) => {
	const keys = Object.keys(updatedStats);
	const playersRawByPid = new Map(playersRaw.map((p) => [p.pid, p]));
	const playersToSave: Player[] = [];

	for (const [i, { pid }] of players.entries()) {
		const p = playersRawByPid.get(pid);

		if (p) {
			const ps = p.stats.at(-1);

			if (ps) {
				for (const key of keys) {
					if (!Number.isNaN(updatedStats[key]![i])) {
						ps[key] = updatedStats[key]![i];
					}
				}

				playersToSave.push(p);
			}
		}
	}

	await idb.cache.players.putAll(playersToSave);
};

export default advStatsSave;
