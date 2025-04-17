import madeHofBaseball from "./madeHof.baseball.ts";
import madeHofBasketball from "./madeHof.basketball.ts";
import madeHofFootball from "./madeHof.football.ts";
import madeHofHockey from "./madeHof.hockey.ts";
import type {
	Player,
	MinimalPlayerRatings,
	PlayerWithoutKey,
} from "../../../common/types.ts";
import { bySport } from "../../../common/index.ts";

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
