import processStatsBasketball from "./processStats.basketball";
import processStatsFootball from "./processStats.football";
import type {
	TeamStatAttr,
	TeamStatType,
	TeamStats,
} from "../../../common/types";
import { isSport } from "../../../common";

const processStats = (
	ts: TeamStats,
	stats: Readonly<TeamStatAttr[]>,
	playoffs: boolean,
	statType: TeamStatType,
) => {
	if (isSport("football")) {
		return processStatsFootball(ts, stats, playoffs);
	}

	return processStatsBasketball(ts, stats, playoffs, statType);
};

export default processStats;
