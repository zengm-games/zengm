import type { DraftPick } from "../../../common/types.ts";
import { orderBy } from "../../../common/utils.ts";
import { idb } from "../index.ts";
import {
	get,
	getAll,
	type Exclusive,
	type GetAllOptions,
	type GetOptions,
	type Query,
} from "./engine.ts";

export type DraftPicksSelector = Exclusive<{ tid: number } | { note: true }>;

const sort = (draftPicks: DraftPick[]) => {
	return orderBy(draftPicks, ["season", "round", "pick", "originalTid"]);
};

// All draft picks are always in the cache, so there is never any need to read from IndexedDB
const toQuery = (
	selector: DraftPicksSelector | undefined,
): Query<DraftPick> => {
	if (selector?.tid !== undefined) {
		const tid = selector.tid;
		return {
			fromCache: async () =>
				sort(await idb.cache.draftPicks.indexGetAll("draftPicksByTid", tid)),
		};
	}

	if (selector?.note) {
		return {
			fromCache: async () => sort(await idb.cache.draftPicks.getAll()),
			matches: (dp) => dp.noteBool === 1,
		};
	}

	return {
		fromCache: async () => sort(await idb.cache.draftPicks.getAll()),
	};
};

export default {
	get: (dpid: number, options?: GetOptions) => get("draftPicks", dpid, options),

	// Sorted by season, round, pick, and originalTid
	getAll: <Output = DraftPick>(
		selector?: DraftPicksSelector,
		options?: GetAllOptions<DraftPick, Output>,
	) => getAll("draftPicks", toQuery(selector), options),
};
