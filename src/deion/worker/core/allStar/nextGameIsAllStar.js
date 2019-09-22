// @flow

import { season } from "..";

const nextGameIsAllStar = async () => {
    const schedule = await season.getSchedule();
    return (
        schedule.length > 0 &&
        schedule[0].homeTid === -1 &&
        schedule[0].awayTid === -2
    );
};

export default nextGameIsAllStar;
