// @flow

import { season } from "..";

const futureGameIsAllStar = async () => {
    const schedule = await season.getSchedule();
    return schedule.some(
        ({ homeTid, awayTid }) => homeTid === -1 && awayTid === -1,
    );
};

export default futureGameIsAllStar;
