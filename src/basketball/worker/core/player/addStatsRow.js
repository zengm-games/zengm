// @flow

import { g } from "../../../../deion/worker/util";
import type { Player } from "../../../../deion/common/types";

/**
 * Add a new row of stats to the playerStats database.
 *
 * A row contains stats for unique values of (pid, team, season, playoffs). So new rows need to be added when a player joins a new team, when a new season starts, or when a player's team makes the playoffs. The team ID in p.tid and player ID in p.pid will be used in the stats row, so if a player is changing teams, update p.tid before calling this.
 *
 * `p.stats` and `p.statsTids` are mutated to reflect the new row, but `p` is NOT saved to the database! So make sure you do that after calling this function. (Or before would be fine too probably, it'd still get marked dirty and flush from cache).
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @param {=boolean} playoffs Is this stats row for the playoffs or not? Default false.
 */
const addStatsRow = async (p: Player<>, playoffs?: boolean = false) => {
    const statsRow = {
        season: g.season,
        tid: p.tid,
        playoffs,
        gp: 0,
        gs: 0,
        min: 0,
        fg: 0,
        fga: 0,
        fgAtRim: 0,
        fgaAtRim: 0,
        fgLowPost: 0,
        fgaLowPost: 0,
        fgMidRange: 0,
        fgaMidRange: 0,
        tp: 0,
        tpa: 0,
        ft: 0,
        fta: 0,
        pm: 0,
        orb: 0,
        drb: 0,
        ast: 0,
        tov: 0,
        stl: 0,
        blk: 0,
        ba: 0,
        pf: 0,
        pts: 0,
        per: 0,
        ewa: 0,
        yearsWithTeam: 1,
        astp: 0,
        blkp: 0,
        drbp: 0,
        orbp: 0,
        stlp: 0,
        trbp: 0,
        usgp: 0,
        drtg: 0,
        ortg: 0,
        dws: 0,
        ows: 0,
    };

    p.statsTids.push(p.tid);
    p.statsTids = Array.from(new Set(p.statsTids));

    // Calculate yearsWithTeam
    const playerStats = p.stats.filter(ps => !ps.playoffs);
    if (playerStats.length > 0) {
        const i = playerStats.length - 1;
        if (
            playerStats[i].season === g.season - 1 &&
            playerStats[i].tid === p.tid
        ) {
            statsRow.yearsWithTeam = playerStats[i].yearsWithTeam + 1;
        }
    }

    p.stats.push(statsRow);
};

export default addStatsRow;
