import RatingsStatsBasketball from "./RatingsStats.basketball";
import RatingsStatsFootball from "./RatingsStats.football";

const RatingsStats = (props: { ratings: any; stats: any }) => {
	if (process.env.SPORT === "football") {
		return RatingsStatsFootball(props);
	}

	return RatingsStatsBasketball(props);
};

export default RatingsStats;
