import ovrBasketball from "./ovr.basketball";
import ovrFootball from "./ovr.football";
import type { MinimalPlayerRatings } from "../../../common/types";
import { isSport } from "../../../common";

const ovr = (ratings: MinimalPlayerRatings, pos?: string) => {
	if (isSport("football")) {
		return ovrFootball(ratings as any, pos as any);
	}

	return ovrBasketball(ratings as any);
};

export default ovr;
