import ovrBaseball from "./ovr.baseball";
import ovrBasketball from "./ovr.basketball";
import ovrFootball from "./ovr.football";
import ovrHockey from "./ovr.hockey";
import type { MinimalPlayerRatings } from "../../../common/types";
import { bySport } from "../../../common";

const ovr = (ratings: MinimalPlayerRatings, pos?: string) => {
	return bySport({
		baseball: ovrBaseball(ratings as any, pos as any),
		basketball: ovrBasketball(ratings as any),
		football: ovrFootball(ratings as any, pos as any),
		hockey: ovrHockey(ratings as any, pos as any),
	});
};

export default ovr;
