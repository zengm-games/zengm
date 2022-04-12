import processStatsBaseball from "./processStats.baseball";
import processStatsBasketball from "./processStats.basketball";
import processStatsFootball from "./processStats.football";
import processStatsHockey from "./processStats.hockey";
import type {
	TeamStatAttr,
	TeamStatType,
	TeamStats,
} from "../../../common/types";
import { bySport } from "../../../common";

const processStats = (
	ts: TeamStats,
	stats: Readonly<TeamStatAttr[]>,
	playoffs: boolean,
	statType: TeamStatType,
) => {
	return bySport({
		baseball: processStatsBaseball(ts, stats, playoffs),
		basketball: processStatsBasketball(ts, stats, playoffs, statType),
		football: processStatsFootball(ts, stats, playoffs),
		hockey: processStatsHockey(ts, stats, playoffs),
	});
};

export default processStats;
