// @flow

import { g } from "../../util";
import type { TeamStats } from "../../../../deion/common/types";

/**
 * Generate a new row of team stats.
 *
 * A row contains stats for unique values of (season, playoffs). So new rows need to be added when a new season starts or when a team makes the playoffs.
 *
 * @memberOf core.team
 * @param {=boolean} playoffs Is this stats row for the playoffs or not? Default false.
 * @return {Object} Team stats object.
 */
const genStatsRow = (tid: number, playoffs?: boolean = false): TeamStats => {
    return {
        tid,
        season: g.season,
        playoffs,
        gp: 0,
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
        orb: 0,
        drb: 0,
        ast: 0,
        tov: 0,
        stl: 0,
        blk: 0,
        pf: 0,
        pts: 0,
        oppFg: 0,
        oppFga: 0,
        oppFgAtRim: 0,
        oppFgaAtRim: 0,
        oppFgLowPost: 0,
        oppFgaLowPost: 0,
        oppFgMidRange: 0,
        oppFgaMidRange: 0,
        oppTp: 0,
        oppTpa: 0,
        oppFt: 0,
        oppFta: 0,
        oppOrb: 0,
        oppDrb: 0,
        oppAst: 0,
        oppTov: 0,
        oppStl: 0,
        oppBlk: 0,
        oppPf: 0,
        oppPts: 0,
    };
};

export default genStatsRow;
