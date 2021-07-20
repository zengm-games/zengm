import { bySport, isSport } from "../../../common";
import { g, helpers } from "../../util";
import newScheduleGood from "./newScheduleGood";

const newSchedule = (
	teams: {
		seasonAttrs: {
			cid: number;
			did: number;
		};
		tid: number;
	}[],
) => {
	const tids = bySport({
		basketball: newScheduleGood(teams),
		football: newScheduleGood(teams),
		hockey: newScheduleGood(teams),
	});

	// Add trade deadline
	const tradeDeadline = g.get("tradeDeadline");
	if (tradeDeadline < 1) {
		const ind = Math.round(helpers.bound(tradeDeadline, 0, 1) * tids.length);
		tids.splice(ind, 0, [-3, -3]);
	}

	// Add an All-Star Game
	if (isSport("basketball")) {
		const allStarGame = g.get("allStarGame");
		if (allStarGame !== null) {
			const ind = Math.round(helpers.bound(allStarGame, 0, 1) * tids.length);
			tids.splice(ind, 0, [-1, -2]);
		}
	}

	return tids;
};

export default newSchedule;
