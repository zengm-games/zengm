import ovrBasketball from "./ovr.basketball";
import ovrFootball from "./ovr.football";
import type { MinimalPlayerRatings } from "../../../common/types";

const ovr = (ratings: MinimalPlayerRatings, pos?: string) => {
	if (process.env.SPORT === "football") {
		return ovrFootball(ratings as any, pos as any);
	}

	return ovrBasketball(ratings as any);
};

export default ovr;
