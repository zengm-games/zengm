import { idb } from "../../db";
import { getUpcoming } from "../../views/schedule";
import { g, toUI } from "../../util";
import { LocalStateUI } from "../../../common/types";

/**
 * Save the schedule to the database, overwriting what's currently there.
 *
 * @param {Array} tids A list of lists, each containing the team IDs of the home and
        away teams, respectively, for every game in the season, respectively.
 * @return {Promise}
 */
const setSchedule = async (tids: [number, number][]) => {
	await idb.cache.schedule.clear();
	await Promise.all(
		tids.map(([homeTid, awayTid]) =>
			idb.cache.schedule.add({
				homeTid,
				awayTid,
			}),
		),
	);

	// Add upcoming games
	const games: LocalStateUI["games"] = [];
	const userTid = g.get("userTid");
	const upcoming = await getUpcoming(userTid);
	for (const game of upcoming) {
		games.push({
			gid: game.gid,
			teams: [
				{
					ovr: game.teams[0].ovr,
					tid: game.teams[0].tid,
				},
				{
					ovr: game.teams[1].ovr,
					tid: game.teams[1].tid,
				},
			],
		});
	}

	await toUI("mergeGames", [games]);
};

export default setSchedule;
