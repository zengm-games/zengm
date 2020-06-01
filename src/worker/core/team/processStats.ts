import processStatsBasketball from "./processStats.basketball";
import processStatsFootball from "./processStats.football";
import type {
	TeamStatAttr,
	TeamStatType,
	TeamStats,
} from "../../../common/types";

const processStats = (
	ts: TeamStats,
	stats: Readonly<TeamStatAttr[]>,
	playoffs: boolean,
	statType: TeamStatType,
) => {
	if (process.env.SPORT === "football") {
		return processStatsFootball(ts, stats, playoffs);
	}

	return processStatsBasketball(ts, stats, playoffs, statType);
};

export default processStats;
