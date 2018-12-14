// @flow

import playerStats from "../player/stats";

const stats = {
    derived: [],
    raw: [
        "drives",
        "totStartYds",
        "timePos",
        ...playerStats.raw.map(stat => stat !== "gs"),
    ],
};

export default stats;
