// @flow

import { idb } from "../../db";

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
};

export default setSchedule;
