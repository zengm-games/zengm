// @flow

import { g } from "../../../deion/worker/util";
import type {
    TeamStatAttr,
    TeamStatType,
    TeamStats,
} from "../../../deion/common/types";

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

const processTeamStats = (
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
                if (ts.fga > 0) {
                    row.fgp = (100 * ts.fg) / ts.fga;
                } else {
                    row.fgp = 0;
                }
            } else if (stat === "oppFgp") {
                if (ts.oppFga > 0) {
                    row.oppFgp = (100 * ts.oppFg) / ts.oppFga;
                } else {
                    row.oppFgp = 0;
                }
            } else if (stat === "fgpAtRim") {
                if (ts.fgaAtRim > 0) {
                    row.fgpAtRim = (100 * ts.fgAtRim) / ts.fgaAtRim;
                } else {
                    row.fgpAtRim = 0;
                }
            } else if (stat === "oppFgpAtRim") {
                if (ts.oppFgaAtRim > 0) {
                    row.oppFgpAtRim = (100 * ts.oppFgAtRim) / ts.oppFgaAtRim;
                } else {
                    row.oppFgpAtRim = 0;
                }
            } else if (stat === "fgpLowPost") {
                if (ts.fgaLowPost > 0) {
                    row.fgpLowPost = (100 * ts.fgLowPost) / ts.fgaLowPost;
                } else {
                    row.fgpLowPost = 0;
                }
            } else if (stat === "oppFgpLowPost") {
                if (ts.oppFgaLowPost > 0) {
                    row.oppFgpLowPost =
                        (100 * ts.oppFgLowPost) / ts.oppFgaLowPost;
                } else {
                    row.oppFgpLowPost = 0;
                }
            } else if (stat === "fgpMidRange") {
                if (ts.fgaMidRange > 0) {
                    row.fgpMidRange = (100 * ts.fgMidRange) / ts.fgaMidRange;
                } else {
                    row.fgpMidRange = 0;
                }
            } else if (stat === "oppFgpMidRange") {
                if (ts.oppFgaMidRange > 0) {
                    row.oppFgpMidRange =
                        (100 * ts.oppFgMidRange) / ts.oppFgaMidRange;
                } else {
                    row.oppFgpMidRange = 0;
                }
            } else if (stat === "tpp") {
                if (ts.tpa > 0) {
                    row.tpp = (100 * ts.tp) / ts.tpa;
                } else {
                    row.tpp = 0;
                }
            } else if (stat === "oppTpp") {
                if (ts.oppTpa > 0) {
                    row.oppTpp = (100 * ts.oppTp) / ts.oppTpa;
                } else {
                    row.oppTpp = 0;
                }
            } else if (stat === "ftp") {
                if (ts.fta > 0) {
                    row.ftp = (100 * ts.ft) / ts.fta;
                } else {
                    row.ftp = 0;
                }
            } else if (stat === "oppFtp") {
                if (ts.oppFta > 0) {
                    row.oppFtp = (100 * ts.oppFt) / ts.oppFta;
                } else {
                    row.oppFtp = 0;
                }
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
                if (possessions > 0) {
                    row.ortg = (100 * ts.pts) / possessions;
                } else {
                    row.ortg = 0;
                }
            } else if (stat === "drtg") {
                const possessions = poss(ts);
                if (possessions > 0) {
                    row.drtg = (100 * ts.oppPts) / possessions;
                } else {
                    row.drtg = 0;
                }
            } else if (stat === "nrtg") {
                const possessions = poss(ts);
                if (possessions > 0) {
                    row.nrtg = (100 * (ts.pts - ts.oppPts)) / possessions;
                } else {
                    row.nrtg = 0;
                }
            } else if (stat === "pace") {
                if (ts.min > 0) {
                    row.pace = (g.quarterLength * 4 * poss(ts)) / (ts.min / 5);
                } else {
                    row.pace = 0;
                }
            } else if (stat === "poss") {
                row.poss = poss(ts);
            } else if (stat === "tpar") {
                if (ts.fga > 0) {
                    row.tpar = (100 * ts.tpa) / ts.fga;
                } else {
                    row.tpar = 0;
                }
            } else if (stat === "ftr") {
                if (ts.fga > 0) {
                    row.ftr = (100 * ts.fta) / ts.fga;
                } else {
                    row.ftr = 0;
                }
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

export default processTeamStats;
