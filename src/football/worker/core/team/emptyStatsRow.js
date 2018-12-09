// @flow

import emptyPlayerStatsRow from "../player/emptyStatsRow";

const emptyStatsRow = {
    tid: 0,
    season: 0,
    playoffs: false,
    drives: 0,
    totStartYds: 0,
    timePos: 0,
};

const skip = ["tid", "season", "playoffs", "yearsWithTeam", "gs", "qbW", "qbL"];
for (const key of Object.keys(emptyPlayerStatsRow)) {
    if (skip.includes(key)) {
        continue;
    }

    emptyStatsRow[key] = 0;
}

export default emptyStatsRow;
