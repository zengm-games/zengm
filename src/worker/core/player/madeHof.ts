import madeHofBasketball from "./madeHof.basketball";
import madeHofFootball from "./madeHof.football";
import type {
	Player,
	MinimalPlayerRatings,
	PlayerWithoutKey,
} from "../../../common/types";

const madeHof = (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
): boolean => {
	if (process.env.SPORT === "football") {
		return madeHofFootball(p as any);
	}

	return madeHofBasketball(p);
};

export default madeHof;
