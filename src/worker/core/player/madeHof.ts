import madeHofBasketball from "./madeHof.basketball";
import madeHofFootball from "./madeHof.football";
import type {
	Player,
	MinimalPlayerRatings,
	PlayerWithoutKey,
} from "../../../common/types";
import { isSport } from "../../../common";

const madeHof = (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
): boolean => {
	if (isSport("football")) {
		return madeHofFootball(p as any);
	}

	return madeHofBasketball(p);
};

export default madeHof;
