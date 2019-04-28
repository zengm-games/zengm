// @flow

import { idb } from "../../../deion/worker/db";
import { g } from "../../../deion/worker/util";
import getDepthPlayers from "../core/player/getDepthPlayers";
import posRatings from "../../common/posRatings";
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
    { abbrev, pos, tid }: { abbrev: string, pos: Position, tid: number },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("gameSim") ||
        updateEvents.includes("playerMovement") ||
        pos !== state.pos ||
        abbrev !== state.abbrev
    ) {
        const editable = tid === g.userTid;

        const ratings = ["hgt", "stre", "spd", "endu", ...posRatings(pos)];

        let players = await idb.cache.players.indexGetAll("playersByTid", tid);
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
            showNoStats: true,
            showRookies: true,
            fuzz: true,
        });

        // Sort players based on current depth chart
        const t = await idb.cache.teams.get(tid);
        if (!t.depth) {
            throw new Error("Missing depth");
        }
        const depthPlayers = getDepthPlayers(t.depth, players);

        return {
            abbrev,
            editable,
            pos,
            players: depthPlayers[pos],
            ratings,
            season: g.season,
            stats: stats.hasOwnProperty(pos) ? stats[pos] : [],
        };
    }
}

export default {
    runBefore: [updateDepth],
};
