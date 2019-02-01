// @flow

import { helpers } from "../../../../deion/worker/util";

const teamAndOpp = [
    "fg",
    "fga",
    "fgAtRim",
    "fgaAtRim",
    "fgLowPost",
    "fgaLowPost",
    "fgMidRange",
    "fgaMidRange",
    "tp",
    "tpa",
    "ft",
    "fta",
    "orb",
    "drb",
    "ast",
    "tov",
    "stl",
    "blk",
    "pf",
    "pts",
];

// raw: recorded directly in game sim
// derived: still stored in database, but not directly recorded in game sim
// not present in this file: transiently derived things, like FG%

const stats = {
    derived: [],
    raw: [
        "gp",
        "min",
        "ba",
        ...teamAndOpp,
        ...teamAndOpp.map(stat => `opp${helpers.upperCaseFirstLetter(stat)}`),
    ],
};

export default stats;
