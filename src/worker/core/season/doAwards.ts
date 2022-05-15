import doAwardsBaseball from "./doAwards.baseball";
import doAwardsBasketball from "./doAwards.basketball";
import doAwardsFootball from "./doAwards.football";
import doAwardsHockey from "./doAwards.hockey";
import type { Conditions } from "../../../common/types";
import { bySport } from "../../../common";

const doAwards = (conditions: Conditions) => {
	return bySport({
		baseball: doAwardsBaseball(conditions),
		basketball: doAwardsBasketball(conditions),
		football: doAwardsFootball(conditions),
		hockey: doAwardsHockey(conditions),
	});
};

export default doAwards;
