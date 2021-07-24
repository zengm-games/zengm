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
	settings?: {
		notify: boolean;
		conditions: Conditions;
	},
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

	if (settings?.notify && warning) {
		// console.log(g.get("season"), warning);
		logEvent(
			{
				type: "error",
				text: `${warning} If you want to <a href="${helpers.leagueUrl([
					"settings",
				])}">try changing some settings</a> (# Games, # Division Games, and # Conference Games), you can then regenerate the schedule in the <a href="${helpers.leagueUrl(
					["danger_zone"],
				)}">danger zone</a>.`,
				saveToDb: false,
			},
			settings.conditions,
		);
	}

	return tids;
};

export default newSchedule;
