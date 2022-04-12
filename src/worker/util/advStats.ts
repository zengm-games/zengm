import { bySport } from "../../common";
import advStatsBaseball from "./advStats.baseball";
import advStatsBasketball from "./advStats.basketball";
import advStatsFootball from "./advStats.football";
import advStatsHockey from "./advStats.hockey";

const advStats = () => {
	return bySport({
		baseball: advStatsBaseball(),
		basketball: advStatsBasketball(),
		football: advStatsFootball(),
		hockey: advStatsHockey(),
	});
};

export default advStats;
