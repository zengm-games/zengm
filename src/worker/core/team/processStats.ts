import processStatsBaseball from "./processStats.baseball.ts";
import processStatsBasketball from "./processStats.basketball.ts";
import processStatsFootball from "./processStats.football.ts";
import processStatsHockey from "./processStats.hockey.ts";
import type {
	TeamStatAttr,
	TeamStatType,
	TeamStats,
} from "../../../common/types.ts";
import { bySport } from "../../../common/index.ts";

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
