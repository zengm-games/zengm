import RatingsOverviewBasketball from "./RatingsOverview.basketball";
import RatingsOverviewFootball from "./RatingsOverview.football";

const RatingsOverview = (props: { ratings: any[] }) => {
	if (process.env.SPORT === "football") {
		return RatingsOverviewFootball(props);
	}

	return RatingsOverviewBasketball(props);
};

export default RatingsOverview;
