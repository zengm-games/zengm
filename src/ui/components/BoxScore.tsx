import BoxScoreBasketball from "./BoxScore.basketball";
import BoxScoreFootball from "./BoxScore.football";

const BoxScore = (props: {
	boxScore: any;
	injuredToBottom?: boolean;
	Row: any;
	forceRowUpdate: boolean;
}) => {
	if (process.env.SPORT === "football") {
		return BoxScoreFootball(props as any);
	}

	return BoxScoreBasketball(props);
};

export default BoxScore;
