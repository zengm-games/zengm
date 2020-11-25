import { g, helpers } from "../../util";
import newScheduleBasketball from "./newSchedule.basketball";
import newScheduleFootball from "./newSchedule.football";

const newSchedule = (
	teams: {
		seasonAttrs: {
			cid: number;
			did: number;
		};
		tid: number;
	}[],
) => {
	const tids =
		process.env.SPORT === "football"
			? newScheduleFootball(teams)
			: newScheduleBasketball(teams);

	const tradeDeadline = g.get("tradeDeadline");
	if (tradeDeadline < 1) {
		const ind = Math.round(helpers.bound(tradeDeadline, 0, 1) * tids.length);
		tids.splice(ind, 0, [-3, -3]);
	}

	return tids;
};

export default newSchedule;
