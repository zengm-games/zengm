import posBaseball from "./pos.baseball";
import posBasketball from "./pos.basketball";
import posFootball from "./pos.football";
import posHockey from "./pos.hockey";
import type { MinimalPlayerRatings } from "../../../common/types";
import { bySport } from "../../../common";

const pos = (ratings: MinimalPlayerRatings) => {
	return bySport<(ratings: any) => string>({
		baseball: posBaseball,
		basketball: posBasketball,
		football: posFootball,
		hockey: posHockey,
	})(ratings as any);
};

export default pos;
