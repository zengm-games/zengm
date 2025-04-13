import doAwardsBaseball from "./doAwards.baseball.ts";
import doAwardsBasketball from "./doAwards.basketball.ts";
import doAwardsFootball from "./doAwards.football.ts";
import doAwardsHockey from "./doAwards.hockey.ts";
import type { Conditions } from "../../../common/types.ts";
import { bySport } from "../../../common/index.ts";

const doAwards = (conditions: Conditions) => {
	return bySport({
		baseball: doAwardsBaseball(conditions),
		basketball: doAwardsBasketball(conditions),
		football: doAwardsFootball(conditions),
		hockey: doAwardsHockey(conditions),
	});
};

export default doAwards;
