// @flow

//import { PLAYER } from "../../../../deion/common";
//import { helpers } from "../../../../deion/worker/util";
import type {
    PlayerStats,
    PlayerStatType,
} from "../../../../deion/common/types";

const percentage = (numerator, denominator) => {
    if (denominator > 0) {
        return (100 * numerator) / denominator;
    }

    return 0;
};

const processStats = (
    ps: PlayerStats,
    stats: string[],
    statType?: PlayerStatType,
    bornYear?: number,
) => {
    const row = {};

    for (const stat of stats) {
        if (stat === "cmpPct") {
            row[stat] = percentage(ps.pssCmp, ps.pss);
        } else if (stat === "qbRat") {
            const a = (ps.pssCmp / ps.pss - 0.3) * 5;
            const b = (ps.pssYds / ps.pss - 3) * 0.25;
            const c = (ps.pssTD / ps.pss) * 20;
            const d = 2.375 - (ps.pssInt / ps.pss) * 25;

            row[stat] = ((a + b + c + d) / 6) * 100;
        } else if (stat === "rusYdsPerAtt") {
            row[stat] = ps.rusYds / ps.rus;
        } else if (stat === "recYdsPerAtt") {
            row[stat] = ps.recYds / ps.rec;
        } else if (stat === "fg") {
            row[stat] = ps.fg0 + ps.fg20 + ps.fg30 + ps.fg40 + ps.fg50;
        } else if (stat === "fga") {
            row[stat] = ps.fga0 + ps.fga20 + ps.fga30 + ps.fga40 + ps.fga50;
        } else if (stat === "fgPct") {
            row[stat] = percentage(
                ps.fg0 + ps.fg20 + ps.fg30 + ps.fg40 + ps.fg50,
                ps.fga0 + ps.fga20 + ps.fga30 + ps.fga40 + ps.fga50,
            );
        } else if (stat === "xpPct") {
            row[stat] = percentage(ps.xp, ps.xpa);
        } else if (stat === "kickingPts") {
            row[stat] =
                3 * (ps.fg0 + ps.fg20 + ps.fg30 + ps.fg40 + ps.fg50) + ps.xp;
        } else if (stat === "pntYdsPerAtt") {
            row[stat] = ps.pntYds / ps.pnt;
        } else {
            row[stat] = ps[stat];
        }

        // For keepWithNoStats
        if (row[stat] === undefined || Number.isNaN(row[stat])) {
            row[stat] = 0;
        }
    }

    // Since they come in same stream, always need to be able to distinguish
    ps.playoffs = ps.playoffs;

    return row;
};

export default processStats;
