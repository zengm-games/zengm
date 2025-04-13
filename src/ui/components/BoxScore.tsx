import { bySport } from "../../common/index.ts";
import BoxScoreBaseball from "./BoxScore.baseball.tsx";
import BoxScoreBasketball from "./BoxScore.basketball.tsx";
import BoxScoreFootball from "./BoxScore.football.tsx";
import BoxScoreHockey from "./BoxScore.hockey.tsx";

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
