import { idb } from "../../db";
import type { TradeTeams } from "../../../common/types";
import isUntradable from "./isUntradable";

/**
 * Validates that players are allowed to be traded and updates the database.
 *
 * If any of the player IDs submitted do not correspond with the two teams that are trading, they will be ignored.
 *
 * @memberOf core.trade
 * @param {Array.<Object>} teams Array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs).
 * @return {Promise.<Array.<Object>>} Resolves to an array taht's the same as the input, but with invalid entries removed.
 */
const updatePlayers = async (teams: TradeTeams): Promise<TradeTeams> => {
	// Make sure each entry in teams has pids and dpids that actually correspond to the correct tid
	for (const t of teams) {
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (!t.dpidsExcluded) {
			t.dpidsExcluded = [];
		}
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (!t.pidsExcluded) {
			t.pidsExcluded = [];
		}

		// Check players
		const players = await idb.getCopies.players({
			tid: t.tid,
		});
		const pidsGood: number[] = [];
		const pidsExcludedGood: number[] = [];

		for (const p of players) {
			// Also, make sure player is not untradable
			if (!isUntradable(p).untradable) {
				if (t.pids.includes(p.pid)) {
					pidsGood.push(p.pid);
				}

				if (t.pidsExcluded.includes(p.pid)) {
					pidsExcludedGood.push(p.pid);
				}
			}
		}

		t.pids = pidsGood;
		t.pidsExcluded = pidsExcludedGood; // Check draft picks

		const draftPicks = await idb.cache.draftPicks.indexGetAll(
			"draftPicksByTid",
			t.tid,
		);
		const dpidsGood: number[] = [];
		const dpidsExcludedGood: number[] = [];

		for (const dp of draftPicks) {
			if (t.dpids.includes(dp.dpid)) {
				dpidsGood.push(dp.dpid);
			}

			if (t.dpidsExcluded.includes(dp.dpid)) {
				dpidsExcludedGood.push(dp.dpid);
			}
		}

		t.dpids = dpidsGood;
		t.dpidsExcluded = dpidsExcludedGood;
	}

	await idb.cache.trade.put({
		rid: 0,
		teams,
	});
	return teams;
};

export default updatePlayers;
