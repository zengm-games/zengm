// @flow

import { PLAYER } from "../../../deion/common";
import { helpers } from "../../../deion/worker/util";
import type { PlayerStats, PlayerStatType } from "../../../deion/common/types";

const processPlayerStats = (
    ps: PlayerStats,
    stats: string[],
    statType: PlayerStatType,
    bornYear: number,
) => {
    const row = {};

    for (const attr of stats) {
        if (attr === "gp") {
            row.gp = ps.gp;
        } else if (attr === "gs") {
            row.gs = ps.gs;
        } else if (attr === "fgp") {
            if (ps.fga > 0) {
                row.fgp = (100 * ps.fg) / ps.fga;
            } else {
                row.fgp = 0;
            }
        } else if (attr === "fgpAtRim") {
            if (ps.fgaAtRim > 0) {
                row.fgpAtRim = (100 * ps.fgAtRim) / ps.fgaAtRim;
            } else {
                row.fgpAtRim = 0;
            }
        } else if (attr === "fgpLowPost") {
            if (ps.fgaLowPost > 0) {
                row.fgpLowPost = (100 * ps.fgLowPost) / ps.fgaLowPost;
            } else {
                row.fgpLowPost = 0;
            }
        } else if (attr === "fgpMidRange") {
            if (ps.fgaMidRange > 0) {
                row.fgpMidRange = (100 * ps.fgMidRange) / ps.fgaMidRange;
            } else {
                row.fgpMidRange = 0;
            }
        } else if (attr === "tpp") {
            if (ps.tpa > 0) {
                row.tpp = (100 * ps.tp) / ps.tpa;
            } else {
                row.tpp = 0;
            }
        } else if (attr === "ftp") {
            if (ps.fta > 0) {
                row.ftp = (100 * ps.ft) / ps.fta;
            } else {
                row.ftp = 0;
            }
        } else if (attr === "tsp") {
            if (ps.fga > 0 || ps.fta > 0) {
                row.tsp = (100 * ps.pts) / (2 * (ps.fga + 0.44 * ps.fta));
            } else {
                row.tsp = 0;
            }
        } else if (attr === "tpar") {
            if (ps.fga > 0) {
                row.tpar = (100 * ps.tpa) / ps.fga;
            } else {
                row.tpar = 0;
            }
        } else if (attr === "ftr") {
            if (ps.fga > 0) {
                row.ftr = (100 * ps.fta) / ps.fga;
            } else {
                row.ftr = 0;
            }
        } else if (attr === "tovp") {
            if (ps.fga > 0 || ps.fta > 0) {
                row.tovp = (100 * ps.tov) / (2 * (ps.fga + 0.44 * ps.fta));
            } else {
                row.tovp = 0;
            }
        } else if (attr === "season") {
            row.season = ps.season;
        } else if (attr === "age") {
            row.age = ps.season - bornYear;
        } else if (attr === "abbrev") {
            if (ps.tid === undefined) {
                row.abbrev = helpers.getAbbrev(PLAYER.FREE_AGENT);
            } else {
                row.abbrev = helpers.getAbbrev(ps.tid);
            }
        } else if (attr === "tid") {
            if (ps.tid === undefined) {
                row.tid = PLAYER.FREE_AGENT;
            } else {
                row.tid = ps.tid;
            }
        } else if (attr === "per") {
            row.per = ps.per;
        } else if (attr === "ewa") {
            row.ewa = ps.ewa;
        } else if (attr === "yearsWithTeam") {
            row.yearsWithTeam = ps.yearsWithTeam;
        } else if (attr === "astp") {
            row.astp = ps.astp;
        } else if (attr === "blkp") {
            row.blkp = ps.blkp;
        } else if (attr === "drbp") {
            row.drbp = ps.drbp;
        } else if (attr === "orbp") {
            row.orbp = ps.orbp;
        } else if (attr === "stlp") {
            row.stlp = ps.stlp;
        } else if (attr === "trbp") {
            row.trbp = ps.trbp;
        } else if (attr === "usgp") {
            row.usgp = ps.usgp;
        } else if (attr === "drtg") {
            row.drtg = ps.drtg;
        } else if (attr === "ortg") {
            row.ortg = ps.ortg;
        } else if (attr === "dws") {
            row.dws = ps.dws;
        } else if (attr === "ows") {
            row.ows = ps.ows;
        } else if (attr === "ws") {
            row.ws = ps.dws + ps.ows;
        } else if (attr === "ws48") {
            row.ws48 = ((ps.dws + ps.ows) * 48) / ps.min;
        } else if (statType === "totals") {
            if (attr === "trb") {
                row.trb = ps.drb + ps.orb;
            } else {
                row[attr] = ps[attr];
            }
        } else if (statType === "per36" && attr !== "min") {
            // Don't scale min by 36 minutes
            const val = attr === "trb" ? ps.drb + ps.orb : ps[attr];
            row[attr] = ps.min > 0 ? (val * 36) / ps.min : 0;
        } else {
            const val = attr === "trb" ? ps.drb + ps.orb : ps[attr];
            row[attr] = ps.gp > 0 ? val / ps.gp : 0;
        }

        // For keepWithNoStats
        if (row[attr] === undefined || Number.isNaN(row[attr])) {
            row[attr] = 0;
        }
    }

    // Since they come in same stream, always need to be able to distinguish
    row.playoffs = ps.playoffs;

    return row;
};

export default processPlayerStats;
