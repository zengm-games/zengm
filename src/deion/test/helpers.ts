import { Cache, idb } from "../worker/db";
import { STORES, Store } from "../worker/db/Cache";
import { defaultGameAttributes, g, helpers } from "../worker/util";
import { footballOverrides } from "../worker/util/defaultGameAttributes";

const mockIDBLeague = (): any => {
	const store = {
		index() {
			return {
				getAll() {
					return [];
				},
			};
		},
	};

	const league = {
		getAll() {
			return [];
		},
		transaction() {
			return {
				store,
				objectStore() {
					return store;
				},
			};
		},
	};

	return league;
};

/**
 * Finds the number of times an element appears in an array.
 *
 * @memberOf test.core
 * @param {Array} array The array to search over.
 * @param {*} x Element to search for
 * @return {number} The number of times x was found in array.
 */
function numInArrayEqualTo<T>(array: T[], x: T): number {
	let n = 0;
	let idx = array.indexOf(x);

	while (idx !== -1) {
		n += 1;
		idx = array.indexOf(x, idx + 1);
	}

	return n;
}

const resetCache = async (data?: Partial<Record<Store, any[]>>) => {
	idb.cache = new Cache(); // We want these to do nothing while testing, usually

	idb.cache.fill = async () => {};

	idb.cache.flush = async () => {};

	for (const store of STORES) {
		// This stuff is all needed because a real Cache.fill is not called.
		idb.cache._data[store] = {};
		idb.cache._deletes[store] = new Set();
		idb.cache._dirtyRecords[store] = new Set();
		idb.cache._maxIds[store] = -1;

		idb.cache._markDirtyIndexes(store);
	}

	idb.cache._status = "full";

	if (!data) {
		return;
	}

	if (data.players) {
		for (const obj of data.players) {
			await idb.cache.players.add(obj);
		}
	}

	if (data.teams) {
		for (const obj of data.teams) {
			await idb.cache.teams.add(obj);
		}
	}

	if (data.teamSeasons) {
		for (const obj of data.teamSeasons) {
			await idb.cache.teamSeasons.add(obj);
		}
	}

	if (data.teamStats) {
		for (const obj of data.teamStats) {
			await idb.cache.teamStats.add(obj);
		}
	}

	if (data.trade) {
		for (const obj of data.trade) {
			await idb.cache.trade.add(obj);
		}
	}
};

const resetG = () => {
	const season = 2016;
	const teams = helpers.getTeamsDefault();
	Object.assign(g, defaultGameAttributes);

	if (process.env.SPORT === "football") {
		Object.assign(g, footballOverrides);
	}

	Object.assign(g, {
		userTid: 0,
		userTids: [0],
		season,
		startingSeason: season,
		leagueName: "",
		teamInfoCache: teams.map(t => ({
			abbrev: t.abbrev,
			disabled: false,
			imgURL: t.imgURL,
			name: t.name,
			region: t.region,
		})),
		gracePeriodEnd: season + 2,
		numTeams: teams.length,
		numActiveTeams: teams.length,
	});
};

export default {
	mockIDBLeague,
	numInArrayEqualTo,
	resetCache,
	resetG,
};
