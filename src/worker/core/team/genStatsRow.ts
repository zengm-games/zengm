import stats from "./stats";
import { g } from "../../util";
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
const genStatsRow = (tid: number, playoffs: boolean = false): TeamStats => {
	const statsRow: TeamStats = {
		playoffs,
		season: g.get("season"),
		tid,
	};

	for (const key of stats.derived) {
		statsRow[key] = 0;
	}

	for (const key of stats.raw) {
		statsRow[key] = 0;
	}

	return statsRow;
};

export default genStatsRow;
