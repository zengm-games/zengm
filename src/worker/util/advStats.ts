import advStatsBasketball from "./advStats.basketball";
import advStatsFootball from "./advStats.football";

const advStats = () => {
	if (process.env.SPORT === "football") {
		return advStatsFootball();
	}

	return advStatsBasketball();
};

export default advStats;
