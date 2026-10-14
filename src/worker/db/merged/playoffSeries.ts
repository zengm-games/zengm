import { g, helpers } from "../../util/index.ts";
import { idb } from "../index.ts";
import { makeStore, type GetOptions } from "./engine.ts";

const store = makeStore("playoffSeries");

export default {
	get: async (season: number, options: GetOptions = {}) => {
		if (season === g.get("season")) {
			// If the current season exists it's always in the cache, so there is no need to check IndexedDB
			const row = await idb.cache.playoffSeries.get(season);
			return options.copy ? helpers.deepCopy(row) : row;
		}

		return store.get(season, options);
	},

	getAll: store.getAll,
};
