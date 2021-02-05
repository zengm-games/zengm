import doAwardsBasketball from "./doAwards.basketball";
import doAwardsFootball from "./doAwards.football";
import doAwardsHockey from "./doAwards.hockey";
import type { Conditions } from "../../../common/types";
import { isSport } from "../../../common";

const doAwards = (conditions: Conditions) => {
	if (isSport("football")) {
		return doAwardsFootball(conditions);
	}

	if (isSport("hockey")) {
		return doAwardsHockey(conditions);
	}

	return doAwardsBasketball(conditions);
};

export default doAwards;
