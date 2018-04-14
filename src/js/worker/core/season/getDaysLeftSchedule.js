// @flow

import getSchedule from "./getSchedule";

/**
 * Get the number of days left in the regular season schedule.
 *
 * @memberOf core.season
 * @return {Promise} The number of days left in the schedule.
 */
const getDaysLeftSchedule = async () => {
    let schedule = await getSchedule();

    let numDays = 0;

    while (schedule.length > 0) {
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
        numDays += 1;
        schedule = schedule.slice(i);
    }

    return numDays;
};

export default getDaysLeftSchedule;
