// @flow

import type { PlayerStats, PlayerStatType } from "../../deion/common/types";

const straightThrough = [
    "gp",
    "gs",
    "per",
    "ewa",
    "yearsWithTeam",
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
];

const percentage = (numerator, denominator) => {
    if (denominator > 0) {
        return (100 * numerator) / denominator;
    }

    return 0;
};

const processStats = (
    ps: PlayerStats,
    stats: string[],
    statType: PlayerStatType,
    bornYear: number,
) => {
    const row = {};

    for (const stat of stats) {
        if (straightThrough.includes(stat)) {
            row[stat] = ps[stat];
        } else if (stat === "fgp") {
            row[stat] = percentage(ps.fg, ps.fga);
        } else if (stat === "fgpAtRim") {
            row[stat] = percentage(ps.fgAtRim, ps.fgaAtRim);
        } else if (stat === "fgpLowPost") {
            row[stat] = percentage(ps.fgLowPost, ps.fgaLowPost);
        } else if (stat === "fgpMidRange") {
            row[stat] = percentage(ps.fgMidRange, ps.fgaMidRange);
        } else if (stat === "tpp") {
            row[stat] = percentage(ps.tp, ps.tpa);
        } else if (stat === "ftp") {
            row[stat] = percentage(ps.ft, ps.fta);
        } else if (stat === "tsp") {
            row[stat] = percentage(ps.pts, 2 * (ps.fga + 0.44 * ps.fta));
        } else if (stat === "tpar") {
            row[stat] = percentage(ps.tpa, ps.fga);
        } else if (stat === "ftr") {
            row[stat] = percentage(ps.fta, ps.fga);
        } else if (stat === "tovp") {
            row[stat] = percentage(ps.tov, 2 * (ps.fga + 0.44 * ps.fta));
        } else if (stat === "season") {
            row.season = ps.season;
        } else if (stat === "age") {
            row.age = ps.season - bornYear;
        } else if (stat === "ws") {
            row.ws = ps.dws + ps.ows;
        } else if (stat === "ws48") {
            row.ws48 = ((ps.dws + ps.ows) * 48) / ps.min;
        } else if (statType === "totals") {
            if (stat === "trb") {
                row.trb = ps.drb + ps.orb;
            } else {
                row[stat] = ps[stat];
            }
        } else if (statType === "per36" && stat !== "min") {
            // Don't scale min by 36 minutes
            const val = stat === "trb" ? ps.drb + ps.orb : ps[stat];
            row[stat] = ps.min > 0 ? (val * 36) / ps.min : 0;
        } else {
            const val = stat === "trb" ? ps.drb + ps.orb : ps[stat];
            row[stat] = ps.gp > 0 ? val / ps.gp : 0;
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
