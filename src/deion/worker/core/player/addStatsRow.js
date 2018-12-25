// @flow

import { g, overrides } from "../../util";
import type { Player } from "../../../common/types";

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
        playoffs,
        season: g.season,
        tid: p.tid,
        yearsWithTeam: 1,
    };

    if (!overrides.core.player.stats) {
        throw new Error("Missing overrides.core.player.stats");
    }
    for (const key of overrides.core.player.stats.derived) {
        statsRow[key] = 0;
    }
    for (const key of overrides.core.player.stats.raw) {
        statsRow[key] = 0;
    }

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
