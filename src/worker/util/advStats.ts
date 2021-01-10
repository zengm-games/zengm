import { isSport } from "../../common";
import advStatsBasketball from "./advStats.basketball";
import advStatsFootball from "./advStats.football";

const advStats = () => {
	if (isSport("football")) {
		return advStatsFootball();
	}

	return advStatsBasketball();
};

export default advStats;
