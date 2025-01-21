import ovrBaseball from "./ovr.baseball";
import ovrBasketball from "./ovr.basketball";
import ovrFootball from "./ovr.football";
import ovrHockey from "./ovr.hockey";
import type { MinimalPlayerRatings } from "../../../common/types";
import { bySport } from "../../../common";

const ovr = (ratings: MinimalPlayerRatings, pos?: string) => {
	return bySport({
		baseball: ovrBaseball,
		basketball: ovrBasketball,
		football: ovrFootball,
		hockey: ovrHockey,
	})(ratings, pos);
};

export default ovr;
