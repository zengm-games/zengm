import { bySport } from "../../common";
import BoxScoreBasketball from "./BoxScore.basketball";
import BoxScoreFootball from "./BoxScore.football";
import BoxScoreHockey from "./BoxScore.hockey";

const BoxScore = (props: {
	boxScore: any;
	Row: any;
	forceRowUpdate: boolean;
}) => {
	return bySport({
		basketball: BoxScoreBasketball(props),
		football: BoxScoreFootball(props as any),
		hockey: BoxScoreHockey(props as any),
	});
};

export default BoxScore;
