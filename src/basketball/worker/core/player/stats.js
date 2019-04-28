// @flow

// raw: recorded directly in game sim
// derived: still stored in database, but not directly recorded in game sim
// not present in this file: transiently derived things, like FG%

const stats = {
    derived: [
        "per",
        "ewa",
        "astp",
        "blkp",
        "drbp",
        "orbp",
        "stlp",
        "trbp",
        "usgp",
        "drtg",
        "ortg",
        "dws",
        "ows",
    ],
    raw: [
        "gp",
        "gs",
        "min",
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
        "pm",
        "orb",
        "drb",
        "ast",
        "tov",
        "stl",
        "blk",
        "ba",
        "pf",
        "pts",
    ],
};

export default stats;
