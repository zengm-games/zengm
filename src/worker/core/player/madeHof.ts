import madeHofBaseball from "./madeHof.baseball";
import madeHofBasketball from "./madeHof.basketball";
import madeHofFootball from "./madeHof.football";
import madeHofHockey from "./madeHof.hockey";
import type {
	Player,
	MinimalPlayerRatings,
	PlayerWithoutKey,
} from "../../../common/types";
import { bySport } from "../../../common";

const madeHof = (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
): boolean => {
	return bySport({
		baseball: madeHofBaseball(p),
		basketball: madeHofBasketball(p),
		football: madeHofFootball(p as any),
		hockey: madeHofHockey(p),
	});
};

export default madeHof;
