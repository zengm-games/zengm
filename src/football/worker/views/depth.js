// @flow

import { idb } from "../../../deion/worker/db";
import { g } from "../../../deion/worker/util";
import posRatings from "../core/player/posRatings";
import type { UpdateEvents } from "../../../deion/common/types";
import type { Position } from "../../common/types";

const defenseStats = [
    "defTckSolo",
    "defTckAst",
    "defTck",
    "defTckLoss",
    "defSk",
    "defSft",
    "defPssDef",
    "defInt",
    "defIntYds",
    "defIntTD",
    "defIntLng",
    "defFmbFrc",
    "defFmbRec",
    "defFmbYds",
    "defFmbTD",
];

const stats: {
    [key: Position]: string[],
} = {
    QB: [
        "pssCmp",
        "pss",
        "cmpPct",
        "pssYds",
        "pssTD",
        "pssInt",
        "pssSk",
        "pssSkYds",
        "qbRat",
        "fmbLost",
    ],
    RB: [
        "rus",
        "rusYds",
        "rusYdsPerAtt",
        "rusLng",
        "rusTD",
        "tgt",
        "rec",
        "recYds",
        "recYdsPerAtt",
        "recTD",
        "recLng",
        "fmbLost",
    ],
    WR: ["tgt", "rec", "recYds", "recYdsPerAtt", "recTD", "recLng", "fmbLost"],
    TE: ["tgt", "rec", "recYds", "recYdsPerAtt", "recTD", "recLng", "fmbLost"],
    OL: [],
    DL: defenseStats,
    LB: defenseStats,
    CB: defenseStats,
    S: defenseStats,
    K: ["fg", "fga", "fgPct", "fgLng", "xp", "xpa", "xpPct", "kickingPts"],
    P: ["pnt", "pntYdsPerAtt", "pntIn20", "pntTB", "pntLng", "pntBlk"],
    KR: ["kr", "krYds", "krYdsPerAtt", "krLng", "krTD"],
    PR: ["pr", "prYds", "prYdsPerAtt", "prLng", "prTD"],
};

async function updateDepth(
    { pos }: { pos: Position },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("gameSim") ||
        updateEvents.includes("playerMovement") ||
        pos !== state.pos
    ) {
        const ratings = ["hgt", "stre", "spd", "endu", ...posRatings(pos)];

        let players = await idb.cache.players.indexGetAll(
            "playersByTid",
            g.userTid,
        );
        players = await idb.getCopies.playersPlus(players, {
            attrs: ["pid", "name", "age", "injury", "watch"],
            ratings: [
                "skills",
                "pos",
                "ovr",
                "pot",
                "ovrs",
                "pots",
                ...ratings,
            ],
            stats: stats[pos],
            season: g.season,
            fuzz: true,
        });

        // Sort players based on current depth chart
        const t = await idb.cache.teams.get(g.userTid);
        const depth = t.depth[pos];

        // Start with players in depth, then add others in arbitrary order
        const playersSorted = depth
            .map(pid => players.find(p => p.pid === pid))
            .concat(players.map(p => (depth.includes(p.pid) ? undefined : p)))
            .filter(p => p !== undefined);

        return {
            abbrev: g.teamAbbrevsCache[g.userTid],
            pos,
            players: playersSorted,
            ratings,
            season: g.season,
            stats: stats.hasOwnProperty(pos) ? stats[pos] : [],
        };
    }
}

export default {
    runBefore: [updateDepth],
};
