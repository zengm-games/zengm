import { bySport } from "../../common";
import advStatsBasketball from "./advStats.basketball";
import advStatsFootball from "./advStats.football";
import advStatsHockey from "./advStats.hockey";

const advStats = () => {
	return bySport({
		basketball: advStatsBasketball(),
		football: advStatsFootball(),
		hockey: advStatsHockey(),
	});
};

export default advStats;
