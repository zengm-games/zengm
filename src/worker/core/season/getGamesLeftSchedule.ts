import getSchedule from "./getSchedule.ts";

/**
 * Get the number of games left in the schedule for each team. This is better than numGames minus games played, because schedules are not always even.
 *
 * Teams with no games left are not in the map. Special games like the All-Star Game are included under their own fake tids, so only look up real tids.
 */
export const getGamesLeftSchedule = async () => {
	const schedule = await getSchedule();

	const gamesLeftByTid = new Map<number, number>();
	for (const { awayTid, homeTid } of schedule) {
		for (const tid of [awayTid, homeTid]) {
			gamesLeftByTid.set(tid, (gamesLeftByTid.get(tid) ?? 0) + 1);
		}
	}

	return gamesLeftByTid;
};
