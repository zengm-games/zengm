import { idb } from "../../db";

/**
 * Remove all players currently added to the trade.
 *
 * @memberOf core.trade
 * @return {Promise}
 */
const clear = async () => {
	const tr = await idb.cache.trade.get(0);

	if (tr) {
		for (const t of tr.teams) {
			t.pids = [];
			t.pidsExcluded = [];
			t.dpids = [];
			t.dpidsExcluded = [];
		}

		await idb.cache.trade.put(tr);
	}
};

export default clear;
