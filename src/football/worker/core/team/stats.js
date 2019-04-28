// @flow

import { helpers } from "../../../../deion/worker/util";
import playerStats from "../player/stats";

const teamAndOpp = [
    "drives",
    "totStartYds",
    "timePos",
    "pts",
    ...playerStats.raw.filter(stat => !["gp", "gs", "defTck"].includes(stat)),
];

// raw: recorded directly in game sim
// derived: still stored in database, but not directly recorded in game sim
// not present in this file: transiently derived things, like FG%

const stats = {
    derived: [],
    raw: [
        "gp",
        ...teamAndOpp,
        ...teamAndOpp.map(stat => `opp${helpers.upperCaseFirstLetter(stat)}`),
    ],
};

export default stats;
