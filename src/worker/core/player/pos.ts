import posBasketball from "./pos.basketball";
import posFootball from "./pos.football";
import type { MinimalPlayerRatings } from "../../../common/types";

const pos = (ratings: MinimalPlayerRatings) => {
	if (process.env.SPORT === "football") {
		return posFootball(ratings as any);
	}

	return posBasketball(ratings as any);
};

export default pos;
