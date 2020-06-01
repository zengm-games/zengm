import doAwardsBasketball from "./doAwards.basketball";
import doAwardsFootball from "./doAwards.football";
import type { Conditions } from "../../../common/types";

const doAwards = (conditions: Conditions) => {
	if (process.env.SPORT === "football") {
		return doAwardsFootball(conditions);
	}

	return doAwardsBasketball(conditions);
};

export default doAwards;
