import posBaseball from "./pos.baseball";
import posBasketball from "./pos.basketball";
import posFootball from "./pos.football";
import posHockey from "./pos.hockey";
import type { MinimalPlayerRatings } from "../../../common/types";
import { bySport } from "../../../common";

const pos = (ratings: MinimalPlayerRatings) => {
	return bySport({
		baseball: posBaseball(ratings as any),
		basketball: posBasketball(ratings as any),
		football: posFootball(ratings as any),
		hockey: posHockey(ratings as any),
	});
};

export default pos;
