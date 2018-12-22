// @flow

import { helpers } from "../../../../deion/worker/util";
import playerStats from "../player/stats";

const teamAndOpp = [
    "drives",
    "totStartYds",
    "timePos",
    "pts",
    "ply",
    ...playerStats.raw.filter(stat => !["gp", "gs", "defTck"].includes(stat)),
];

const stats = {
    derived: [
        ...playerStats.derived.filter(stat => !["qbW", "qbL"].includes(stat)),
    ],
    raw: [
        "gp",
        ...teamAndOpp,
        ...teamAndOpp.map(stat => `opp${helpers.upperCaseFirstLetter(stat)}`),
    ],
};

console.log(stats);

export default stats;
