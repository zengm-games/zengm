import doAwardsBasketball from "./doAwards.basketball";
import doAwardsFootball from "./doAwards.football";
import type { Conditions } from "../../../common/types";
import { isSport } from "../../../common";

const doAwards = (conditions: Conditions) => {
	if (isSport("football")) {
		return doAwardsFootball(conditions);
	}

	return doAwardsBasketball(conditions);
};

export default doAwards;
