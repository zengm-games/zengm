import { getAll, idb } from "../db/index.ts";
import g from "./g.ts";
import type { Game } from "../../common/types.ts";

/**
 * Generate a game log list.
 *
 * @memberOf helpers
 * @param {string} abbrev Abbrev of the team for the list of games.
 * @param {number} season Season for the list of games.
 * @param {number} gid Integer game ID for the box score (a negative number means no box score), which is used only for highlighting the relevant entry in the list.
 * @param {Array.<Object>} gid Array of already-loaded games. If this is not empty, then only new games that are not already in this array will be passed to the callback.
 * @return {Promise.<Array.<Object>>} Resolves to a list of game objects.
 */
const getProcessedGames = async ({
	tid,
	season,
	loadedGames = [],
	includeAllStarGame = false,
}: {
	tid: number;
	season: number;
	loadedGames?: Game[];
	includeAllStarGame?: boolean;
}) => {
	let maxGid;

	if (loadedGames[0]) {
		maxGid = loadedGames[0].gid; // Load new games
	} else {
		maxGid = -1; // Load all games
	}

	const gameInfos: Game[] = [];
	let games;

	if (season === g.get("season")) {
		games = await idb.cache.games.getAll();
	} else {
		games = await getAll(
			idb.league.transaction("games").store.index("season"),
			season,
		);
	}

	// Iterate backwards, was more useful back when current season wasn't cached
	for (let i = games.length - 1; i >= 0; i--) {
		const gm = games[i]!;

		if (gm.gid <= maxGid) {
			break;
		}

		// Check tid
		if (gm.teams[0].tid === tid || gm.teams[1].tid === tid) {
			gameInfos.push(gm);
		} else if (
			includeAllStarGame &&
			gm.teams[0].tid === -1 &&
			gm.teams[1].tid === -2
		) {
			gameInfos.push(gm);
		}
	}

	return gameInfos;
};

export default getProcessedGames;
