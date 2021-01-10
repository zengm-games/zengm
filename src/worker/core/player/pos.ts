import posBasketball from "./pos.basketball";
import posFootball from "./pos.football";
import type { MinimalPlayerRatings } from "../../../common/types";
import { isSport } from "../../../common";

const pos = (ratings: MinimalPlayerRatings) => {
	if (isSport("football")) {
		return posFootball(ratings as any);
	}

	return posBasketball(ratings as any);
};

export default pos;
