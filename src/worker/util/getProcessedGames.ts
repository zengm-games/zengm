import { idb } from "../db/index.ts";
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
export const getProcessedGames = async ({
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

	// Only keep new games involving this team, rather than every game this season
	const games = await idb.merged.games.getAll(
		{ season },
		{
			filter: (gm) =>
				gm.gid > maxGid &&
				(gm.teams[0].tid === tid ||
					gm.teams[1].tid === tid ||
					(includeAllStarGame &&
						gm.teams[0].tid === -1 &&
						gm.teams[1].tid === -2)),
		},
	);

	// Newest first
	return games.reverse();
};
