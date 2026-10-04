import { bySport } from "../../common/sportFunctions.ts";
import BoxScoreBaseball from "./BoxScore.baseball.tsx";
import BoxScoreBasketball from "./BoxScore.basketball.tsx";
import BoxScoreFootball from "./BoxScore.football.tsx";
import BoxScoreHockey from "./BoxScore.hockey.tsx";

export const BoxScore = (props: {
	boxScore: unknown;
	Row: unknown;
	forceRowUpdate: boolean;
	sportState?: unknown;
}) => {
	return bySport({
		baseball: BoxScoreBaseball(props as any),
		basketball: BoxScoreBasketball(props),
		football: BoxScoreFootball(props as any),
		hockey: BoxScoreHockey(props as any),
	});
};
