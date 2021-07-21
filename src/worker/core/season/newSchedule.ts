import { isSport } from "../../../common";
import type { Conditions } from "../../../common/types";
import { g, helpers, logEvent } from "../../util";
import newScheduleGood from "./newScheduleGood";

const newSchedule = (
	teams: {
		seasonAttrs: {
			cid: number;
			did: number;
		};
		tid: number;
	}[],
	conditions?: Conditions,
) => {
	const { tids, warning } = newScheduleGood(teams);

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

	if (warning) {
		// console.log(g.get("season"), warning);
		logEvent(
			{
				type: "error",
				text: warning,
				saveToDb: false,
			},
			conditions,
		);
	}

	return tids;
};

export default newSchedule;
