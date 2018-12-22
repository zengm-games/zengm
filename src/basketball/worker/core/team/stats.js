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

const stats = {
    derived: [],
    raw: [
        "gp",
        "min",
        ...teamAndOpp,
        ...teamAndOpp.map(stat => `opp${helpers.upperCaseFirstLetter(stat)}`),
    ],
};

export default stats;
