import { g, helpers } from "../../util/index.ts";
import { idb } from "../index.ts";
import { MergedStore, type GetOptions } from "./engine.ts";

class PlayoffSeriesStore extends MergedStore<"playoffSeries"> {
	override async get(season: number, options: GetOptions = {}) {
		if (season === g.get("season")) {
			// If the current season exists it's always in the cache, so there is no need to check IndexedDB
			const row = await idb.cache.playoffSeries.get(season);
			return options.copy ? helpers.deepCopy(row) : row;
		}

		return super.get(season, options);
	}
}

export default new PlayoffSeriesStore("playoffSeries");
