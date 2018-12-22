// @flow

import { g } from "../../../../deion/worker/util";
import type {
    TeamStatAttr,
    TeamStatType,
    TeamStats,
} from "../../../../deion/common/types";

const percentage = (numerator, denominator) => {
    if (denominator > 0) {
        return (100 * numerator) / denominator;
    }

    return 0;
};

const processStats = (
    ts: TeamStats,
    stats: TeamStatAttr[],
    playoffs: boolean,
    statType: TeamStatType,
) => {
    const row = {};

    if (ts.gp > 0) {
        for (const stat of stats) {
            if (stat === "mov") {
                if (ts.gp > 0) {
                    row.mov = (ts.pts - ts.oppPts) / ts.gp;
                } else {
                    row.mov = 0;
                }
            } else if (stat === "oppMov") {
                if (ts.gp > 0) {
                    row.oppMov = (ts.oppPts - ts.pts) / ts.gp;
                } else {
                    row.oppMov = 0;
                }
            } else if (stat === "yds") {
                row[stat] = ts.pssYds + ts.rusYds;
            } else if (stat === "ydsPerPlay") {
                row[stat] = (ts.pssYds + ts.rusYds) / ts.ply;
            } else if (stat === "tov") {
                row[stat] = ts.fmbLost + ts.pssInt;
            } else if (stat === "pssNetYdsPerAtt") {
                row[stat] = (ts.pssYds - ts.pssSkYds) / (ts.pss + ts.pssSk);
            } else if (stat === "rusYdsPerAtt") {
                row[stat] = ts.rusYds / ts.rus;
            } else {
                row[stat] = ts[stat];
            }
        }
    } else {
        for (const stat of stats) {
            if (stat === "season" || stat === "playoffs") {
                row[stat] = ts[stat];
            } else {
                row[stat] = 0;
            }
        }
    }

    // Since they come in same stream, always need to be able to distinguish
    row.playoffs = ts.playoffs !== undefined ? ts.playoffs : playoffs;

    return row;
};

export default processStats;
