import type { GameResults, NonEmptyArray } from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import { helpers, local } from "../../util/index.ts";

export const setLiveSimRatingsStatsPopoverPlayers = async (
	results: GameResults[],
) => {
	// Maximally conservative - scan all the players and get pids from there, rather than looking at tids and the database, in case somehow a tid changed
	const pids = [];
	for (const result of results) {
		for (const t of result.team) {
			for (const p of t.player) {
				pids.push(p.id);
			}
		}
	}

	const players = (await idb.getCopies.players({ pids }, "noCopyCache")).map(
		(p) => {
			// Rather than cloning the entire object, just clone the part that we care about remaining constant (current stats row, and also ratings in case of injury)
			const currentStats = helpers.deepCopy(p.stats.at(-1));

			return {
				...p,
				ratings: [...p.ratings] as NonEmptyArray<any>,
				stats: [...p.stats.slice(0, -1), currentStats],
			};
		},
	);

	local.liveSimRatingsStatsPopoverPlayers = {};
	for (const p of players) {
		local.liveSimRatingsStatsPopoverPlayers[p.pid] = p;
	}
};
