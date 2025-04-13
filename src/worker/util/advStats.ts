import { bySport } from "../../common/index.ts";
import advStatsBaseball from "./advStats.baseball.ts";
import advStatsBasketball from "./advStats.basketball.ts";
import advStatsFootball from "./advStats.football.ts";
import advStatsHockey from "./advStats.hockey.ts";

const advStats = () => {
	return bySport({
		baseball: advStatsBaseball(),
		basketball: advStatsBasketball(),
		football: advStatsFootball(),
		hockey: advStatsHockey(),
	});
};

export default advStats;
