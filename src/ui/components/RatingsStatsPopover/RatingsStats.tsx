import RatingsStatsBasketball from "./RatingsStats.basketball";
import RatingsStatsFootball from "./RatingsStats.football";
import RatingsStatsHockey from "./RatingsStats.hockey";
import { useLocal } from "../../util";
import { bySport } from "../../../common";

const RatingsStats = (props: {
	ratings: any;
	stats: any;
	type?: "career" | "current" | "draft" | number;
}) => {
	const challengeNoRatings = useLocal(state => state.challengeNoRatings);

	return bySport({
		basketball: RatingsStatsBasketball({
			...props,
			challengeNoRatings,
		}),
		football: RatingsStatsFootball({
			...props,
			challengeNoRatings,
		}),
		hockey: RatingsStatsHockey({
			...props,
			challengeNoRatings,
		}),
	});
};

export default RatingsStats;
