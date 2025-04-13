import posBaseball from "./pos.baseball.ts";
import posBasketball from "./pos.basketball.ts";
import posFootball from "./pos.football.ts";
import posHockey from "./pos.hockey.ts";
import type { MinimalPlayerRatings } from "../../../common/types.ts";
import { bySport } from "../../../common/index.ts";

const pos = (ratings: MinimalPlayerRatings) => {
	return bySport<(ratings: any) => string>({
		baseball: posBaseball,
		basketball: posBasketball,
		football: posFootball,
		hockey: posHockey,
	})(ratings as any);
};

export default pos;
