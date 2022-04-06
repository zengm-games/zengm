import { bySport } from "../../common";
import BoxScoreBaseball from "./BoxScore.baseball";
import BoxScoreBasketball from "./BoxScore.basketball";
import BoxScoreFootball from "./BoxScore.football";
import BoxScoreHockey from "./BoxScore.hockey";

const BoxScore = (props: {
	boxScore: any;
	Row: any;
	forceRowUpdate: boolean;
	sportState?: any;
}) => {
	return bySport({
		baseball: BoxScoreBaseball(props as any),
		basketball: BoxScoreBasketball(props),
		football: BoxScoreFootball(props as any),
		hockey: BoxScoreHockey(props as any),
	});
};

export default BoxScore;
