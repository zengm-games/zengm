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
		return schedule.filter(game => game.day === schedule[0].day);
	}

	return schedule;
};

export default getSchedule;
