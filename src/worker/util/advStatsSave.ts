import { idb } from "../db";
import type { MinimalPlayerRatings, Player } from "../../common/types";

const advStatsSave = async (
	players: any[],
	playersRaw: Player<MinimalPlayerRatings>[],
	updatedStats: Record<string, number[]>,
) => {
	const keys = Object.keys(updatedStats);
	await Promise.all(
		players.map(async ({ pid }, i) => {
			const p = playersRaw.find(p2 => p2.pid === pid);

			if (p) {
				const ps = p.stats.at(-1);

				if (ps) {
					for (const key of keys) {
						if (!Number.isNaN(updatedStats[key][i])) {
							ps[key] = updatedStats[key][i];
						}
					}

					await idb.cache.players.put(p);
				}
			}
		}),
	);
};

export default advStatsSave;
