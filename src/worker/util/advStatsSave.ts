import { idb } from "../db/index.ts";
import type { Player } from "../../common/types.ts";
import { groupByUnique } from "../../common/utils.ts";

const advStatsSave = async (
	players: any[],
	playersRaw: Player[],
	updatedStats: Record<string, number[] | number[][]>,
) => {
	const playersByPid = groupByUnique(playersRaw, (p) => p.pid);
	const playersToSave = [];
	const keys = Object.keys(updatedStats);
	for (const [i, { pid }] of players.entries()) {
		const p = playersByPid[pid];

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
