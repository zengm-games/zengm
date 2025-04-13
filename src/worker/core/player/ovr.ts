import ovrBaseball from "./ovr.baseball.ts";
import ovrBasketball from "./ovr.basketball.ts";
import ovrFootball from "./ovr.football.ts";
import ovrHockey from "./ovr.hockey.ts";
import type { MinimalPlayerRatings } from "../../../common/types.ts";
import { bySport } from "../../../common/index.ts";

const ovr = (ratings: MinimalPlayerRatings, pos?: string) => {
	return bySport<(...args: any[]) => number>({
		baseball: ovrBaseball,
		basketball: ovrBasketball,
		football: ovrFootball,
		hockey: ovrHockey,
	})(ratings, pos);
};

export default ovr;
