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
            row[stat] = row.rusYds / row.rus;
        } else {
            row[stat] = ps[stat];
        }

        // For keepWithNoStats
        if (row[stat] === undefined || Number.isNaN(row[stat])) {
            row[stat] = 0;
        }
    }

    // Since they come in same stream, always need to be able to distinguish
    row.playoffs = ps.playoffs;

    return row;
};

export default processStats;
