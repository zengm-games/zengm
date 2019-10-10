// @flow

import { idb } from "../db";

const getTeamColors = async (tid: number) => {
    let teamColors = ["#000", "#ccc", "#fff"];
    if (tid >= 0) {
        const t = await idb.cache.teams.get(tid);
        if (t) {
            teamColors = t.colors;
        }
    }

    return teamColors;
};

export default getTeamColors;
