import type { DraftPick } from "../../../common/types.ts";
import { orderBy } from "../../../common/utils.ts";
import { idb } from "../index.ts";
import { MergedStore, type Exclusive, type Query } from "./engine.ts";

export type DraftPicksSelector = Exclusive<{ tid: number } | { note: true }>;

const sort = (draftPicks: DraftPick[]) => {
	return orderBy(draftPicks, ["season", "round", "pick", "originalTid"]);
};

// All draft picks are always in the cache, so there is never any need to read from IndexedDB. Results are always sorted by season, round, pick, and originalTid.
class DraftPicksStore extends MergedStore<"draftPicks", DraftPicksSelector> {
	protected override toQuery(
		selector: DraftPicksSelector | undefined,
	): Query<DraftPick> {
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
	}
}

export default new DraftPicksStore("draftPicks");
