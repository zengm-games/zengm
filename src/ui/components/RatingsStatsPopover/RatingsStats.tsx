import RatingsStatsBasketball from "./RatingsStats.basketball";
import RatingsStatsFootball from "./RatingsStats.football";
import { useLocal } from "../../util";

const RatingsStats = (props: { ratings: any; stats: any }) => {
	const challengeNoRatings = useLocal(state => state.challengeNoRatings);

	if (process.env.SPORT === "football") {
		return RatingsStatsFootball({
			...props,
			challengeNoRatings,
		});
	}

	return RatingsStatsBasketball({
		...props,
		challengeNoRatings,
	});
};

export default RatingsStats;
