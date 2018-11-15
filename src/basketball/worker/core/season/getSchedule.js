// @flow

import { idb } from "../../db";
import { g } from "../../util";
import type { ScheduleGame } from "../../../common/types";

/**
 * Get an array of games from the schedule.
 *
 * @param {(IDBObjectStore|IDBTransaction|null)} options.ot An IndexedDB object store or transaction on schedule; if null is passed, then a new transaction will be used.
 * @param {boolean} options.oneDay Return just one day (true) or all days (false). Default false.
 * @return {Promise} Resolves to the requested schedule array.
 */
const getSchedule = async (
    oneDay?: boolean = false,
): Promise<ScheduleGame[]> => {
    let schedule = await idb.cache.schedule.getAll();
    if (oneDay) {
        schedule = schedule.slice(0, g.numTeams / 2); // This is the maximum number of games possible in a day

        // Only take the games up until right before a team plays for the second time that day
        const tids = [];
        let i;
        for (i = 0; i < schedule.length; i++) {
            if (
                !tids.includes(schedule[i].homeTid) &&
                !tids.includes(schedule[i].awayTid)
            ) {
                tids.push(schedule[i].homeTid);
                tids.push(schedule[i].awayTid);
            } else {
                break;
            }
        }
        schedule = schedule.slice(0, i);
    }

    return schedule;
};

export default getSchedule;
