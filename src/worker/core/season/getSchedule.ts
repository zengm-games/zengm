import { idb } from "../../db";
import type { ScheduleGame } from "../../../common/types";

/**
 * Get an array of games from the schedule.
 *
 * @param {(IDBObjectStore|IDBTransaction|null)} options.ot An IndexedDB object store or transaction on schedule; if null is passed, then a new transaction will be used.
 * @param {boolean} options.oneDay Return just one day (true) or all days (false). Default false.
 * @return {Promise} Resolves to the requested schedule array.
 */
const getSchedule = async (
	oneDay: boolean = false,
): Promise<ScheduleGame[]> => {
	const schedule = await idb.cache.schedule.getAll();

	if (schedule.length === 0) {
		return schedule;
	}

	if (oneDay) {
		const partialSchedule = [];
		const tids = new Set();
		for (const game of schedule) {
			if (game.day !== schedule[0].day) {
				// Only keep games from same day
				break;
			}
			if (tids.has(game.homeTid) || tids.has(game.awayTid)) {
				// Only keep games from unique teams, no 2 games in 1 day
				break;
			}

			// For ASG and trade deadline, make absolutely sure they are alone. This shouldn't be necessary because addDaysToSchedule should handle it, but just in case...
			if ((game.homeTid < 0 || game.awayTid < 0) && tids.size > 0) {
				break;
			}

			partialSchedule.push(game);
			tids.add(game.homeTid);
			tids.add(game.awayTid);

			// For ASG and trade deadline, make absolutely sure they are alone. This shouldn't be necessary because addDaysToSchedule should handle it, but just in case...
			if (game.homeTid < 0 || game.awayTid < 0) {
				break;
			}
		}
		return partialSchedule;
	}

	return schedule;
};

export default getSchedule;
