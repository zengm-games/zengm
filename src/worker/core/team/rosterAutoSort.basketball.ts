import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";

/**
 * Given a list of players sorted by ability, find the starters.
 *
 *
 * @param  {[type]} players [description]
 * @param {Array.<string>} p Array positions of players on roster, sorted by value already.
 * @return {Array.<number>} Indexes of the starters from the input array. If this is of length < 5, then satisfactory starters couldn't be found and any players should be used to fill in the starting lineup.
 */
export const findStarters = (positions: string[]): number[] => {
	const starters: number[] = []; // Will be less than 5 in length if that's all it takes to meet requirements

	let numG = 0;
	let numFC = 0;
	let numC = 0;

	for (const [i, pos] of positions.entries()) {
		if (starters.length === 5 || (numG >= 2 && numFC >= 2)) {
			break;
		}

		// Make sure we can get 2 G and 2 F/C
		if (
			5 - starters.length >
				(2 - numG > 0 ? 2 - numG : 0) + (2 - numFC > 0 ? 2 - numFC : 0) ||
			(numG < 2 && pos.includes("G")) ||
			(numFC < 2 && (pos.includes("F") || (pos === "C" && numC === 0)))
		) {
			starters.push(i);
			numG += pos.includes("G") ? 1 : 0;
			numFC += pos.includes("F") || pos === "C" ? 1 : 0;
			numC += pos === "C" ? 1 : 0;
		}
	}

	// Fill in after meeting requirements, but still not too many Cs!
	for (const [i, pos] of positions.entries()) {
		if (starters.length === 5) {
			break;
		}

		if (starters.includes(i)) {
			continue;
		}

		if (numC >= 1 && pos === "c") {
			continue;
		}

		starters.push(i);
		numC += pos === "C" ? 1 : 0;
	}

	return starters;
};

export const getRosterOrderByPid = (
	players: {
		pid: number;
		valueNoPot: number;
		valueNoPotFuzz: number;
		ratings: {
			pos: string;
		};
	}[],
	tid: number,
	fuzzUser: boolean,
) => {
	// Fuzz only for user's team
	if (fuzzUser && tid === g.get("userTid")) {
		players.sort((a, b) => b.valueNoPotFuzz - a.valueNoPotFuzz);
	} else {
		players.sort((a, b) => b.valueNoPot - a.valueNoPot);
	}

	// Shuffle array so that position conditions are met - 2 G and 2 F/C in starting lineup, at most one pure C
	const positions = players.map((p) => p.ratings.pos);
	const starters = findStarters(positions);
	const newPlayers = starters.map((i) => players[i]!);

	for (const [i, p] of players.entries()) {
		if (!starters.includes(i)) {
			newPlayers.push(p);
		}
	}

	const rosterOrders = new Map();

	for (const [i, p] of newPlayers.entries()) {
		rosterOrders.set(p.pid, i);
	}

	return rosterOrders;
};

/**
 * Sort a team's roster based on player ratings and stats.
 *
 * @memberOf core.team
 * @param {number} tid Team ID.
 * @return {Promise}
 */
const rosterAutoSort = async (tid: number, onlyNewPlayers?: boolean) => {
	if (onlyNewPlayers) {
		// This option is just for football currently
		return;
	}

	// Get roster and sort by value (no potential included)
	const playersFromCache = await idb.cache.players.indexGetAll(
		"playersByTid",
		tid,
	);
	const players = await idb.getCopies.playersPlus(playersFromCache, {
		attrs: ["pid", "valueNoPot", "valueNoPotFuzz"],
		ratings: ["pos"],
		season: g.get("season"),
		showNoStats: true,
		showRookies: true,
	});

	const rosterOrders = getRosterOrderByPid(players, tid, true);

	// Update rosterOrder
	for (const p of playersFromCache) {
		const rosterOrder = rosterOrders.get(p.pid);

		// Only write to DB if this actually changes
		if (rosterOrder !== undefined && rosterOrder !== p.rosterOrder) {
			p.rosterOrder = rosterOrder;
			await idb.cache.players.put(p);
		}
	}
};

export default rosterAutoSort;
