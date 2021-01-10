import RatingsStatsBasketball from "./RatingsStats.basketball";
import RatingsStatsFootball from "./RatingsStats.football";
import { useLocal } from "../../util";
import { isSport } from "../../../common";

const RatingsStats = (props: { ratings: any; stats: any }) => {
	const challengeNoRatings = useLocal(state => state.challengeNoRatings);

	if (isSport("football")) {
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
