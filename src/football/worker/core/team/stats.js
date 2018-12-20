// @flow

import playerStats from "../player/stats";

const stats = {
    derived: playerStats.derived.filter(stat => !["qbW", "qbL"].includes(stat)),
    raw: [
        "drives",
        "totStartYds",
        "timePos",
        ...playerStats.raw.filter(stat => !["gs", "defTck"].includes(stat)),
    ],
};

export default stats;
