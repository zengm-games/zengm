// @flow

import { g } from "../../../../deion/worker/util";
import type {
    TeamStatAttr,
    TeamStatType,
    TeamStats,
} from "../../../../deion/common/types";

// Possessions estimate, from https://www.basketball-reference.com/about/glossary.html#poss
const poss = ts => {
    if (ts.orb + ts.oppDrb > 0 && ts.oppOrb + ts.drb > 0) {
        return (
            0.5 *
            (ts.fga +
                0.4 * ts.fta -
                1.07 * (ts.orb / (ts.orb + ts.oppDrb)) * (ts.fga - ts.fg) +
                ts.tov +
                (ts.oppFga +
                    0.4 * ts.oppFta -
                    1.07 *
                        (ts.oppOrb / (ts.oppOrb + ts.drb)) *
                        (ts.oppFga - ts.oppFg) +
                    ts.oppTov))
        );
    }
    return 0;
};

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
            if (stat === "gp") {
                row.gp = ts.gp;
            } else if (stat === "fgp") {
                row[stat] = percentage(ts.fg, ts.fga);
            } else if (stat === "oppFgp") {
                row[stat] = percentage(ts.oppFg, ts.oppFga);
            } else if (stat === "fgpAtRim") {
                row[stat] = percentage(ts.fgAtRim, ts.fgaAtRim);
            } else if (stat === "oppFgpAtRim") {
                row[stat] = percentage(ts.oppFgAtRim, ts.oppFgaAtRim);
            } else if (stat === "fgpLowPost") {
                row[stat] = percentage(ts.fgLowPost, ts.fgaLowPost);
            } else if (stat === "oppFgpLowPost") {
                row[stat] = percentage(ts.oppFgLowPost, ts.oppFgaLowPost);
            } else if (stat === "fgpMidRange") {
                row[stat] = percentage(ts.fgMidRange, ts.fgaMidRange);
            } else if (stat === "oppFgpMidRange") {
                row[stat] = percentage(ts.oppFgMidRange, ts.oppFgaMidRange);
            } else if (stat === "tpp") {
                row[stat] = percentage(ts.tp, ts.tpa);
            } else if (stat === "oppTpp") {
                row[stat] = percentage(ts.oppTp, ts.oppTpa);
            } else if (stat === "ftp") {
                row[stat] = percentage(ts.ft, ts.fta);
            } else if (stat === "oppFtp") {
                row[stat] = percentage(ts.oppFt, ts.oppFta);
            } else if (stat === "mov") {
                if (statType === "totals") {
                    row.mov = ts.pts - ts.oppPts;
                } else if (ts.gp > 0) {
                    row.mov = (ts.pts - ts.oppPts) / ts.gp;
                } else {
                    row.mov = 0;
                }
            } else if (stat === "oppMov") {
                if (statType === "totals") {
                    row.oppMov = ts.oppPts - ts.pts;
                } else if (ts.gp > 0) {
                    row.oppMov = (ts.oppPts - ts.pts) / ts.gp;
                } else {
                    row.oppMov = 0;
                }
            } else if (stat === "pw") {
                if (ts.pts > 0 || ts.oppPts > 0) {
                    row.pw =
                        ts.gp *
                        (ts.pts ** 14 / (ts.pts ** 14 + ts.oppPts ** 14));
                } else {
                    row.pw = 0;
                }
            } else if (stat === "pl") {
                if (ts.pts > 0 || ts.oppPts > 0) {
                    row.pl =
                        ts.gp -
                        ts.gp *
                            (ts.pts ** 14 / (ts.pts ** 14 + ts.oppPts ** 14));
                } else {
                    row.pl = 0;
                }
            } else if (stat === "ortg") {
                const possessions = poss(ts);
                row[stat] = percentage(ts.pts, possessions);
            } else if (stat === "drtg") {
                const possessions = poss(ts);
                row[stat] = percentage(ts.oppPts, possessions);
            } else if (stat === "nrtg") {
                const possessions = poss(ts);
                row[stat] = percentage(ts.pts - ts.oppPts, possessions);
            } else if (stat === "pace") {
                if (ts.min > 0) {
                    row.pace = (g.quarterLength * 4 * poss(ts)) / (ts.min / 5);
                } else {
                    row.pace = 0;
                }
            } else if (stat === "poss") {
                row.poss = poss(ts);
            } else if (stat === "tpar") {
                row[stat] = percentage(ts.tpa, ts.fga);
            } else if (stat === "ftr") {
                row[stat] = percentage(ts.fta, ts.fga);
            } else if (stat === "season" || stat === "playoffs") {
                row[stat] = ts[stat];
            } else if (statType === "totals") {
                if (stat === "trb") {
                    row.trb = ts.drb + ts.orb;
                } else if (stat === "oppTrb") {
                    row.oppTrb = ts.oppDrb + ts.oppOrb;
                } else {
                    row[stat] = ts[stat];
                }
            } else {
                // eslint-disable-next-line no-lonely-if
                if (stat === "trb") {
                    row.trb = (ts.drb + ts.orb) / ts.gp;
                } else if (stat === "oppTrb") {
                    row.oppTrb = (ts.oppDrb + ts.oppOrb) / ts.gp;
                } else {
                    row[stat] = ts[stat] / ts.gp;
                }
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
