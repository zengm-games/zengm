import RatingsStatsBaseball from "./RatingsStats.baseball.tsx";
import RatingsStatsBasketball from "./RatingsStats.basketball.tsx";
import RatingsStatsFootball from "./RatingsStats.football.tsx";
import RatingsStatsHockey from "./RatingsStats.hockey.tsx";
import { useLocalPartial } from "../../util/local.ts";
import { bySport } from "../../../common/sportFunctions.ts";

export const RatingsStats = (props: {
	ratings: any;
	stats: any;
	type?: "career" | "current" | "draft" | number;
}) => {
	const { challengeNoRatings } = useLocalPartial(["challengeNoRatings"]);

	return bySport({
		baseball: RatingsStatsBaseball({
			...props,
			challengeNoRatings,
		}),
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
