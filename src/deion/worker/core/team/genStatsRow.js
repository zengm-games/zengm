// @flow

import { g, overrides } from "../../util";
import type { TeamStats } from "../../../common/types";

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
    if (!overrides.core.team.emptyStatsRow) {
        throw new Error("Missing overrides.core.team.emptyStatsRow");
    }
    return {
        ...overrides.core.team.emptyStatsRow,
        playoffs,
        season: g.season,
        tid,
    };
};

export default genStatsRow;
