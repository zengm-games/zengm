import { WEBSITE_ROOT } from "../../../common";
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
	const allStarGame = g.get("allStarGame");
	if (allStarGame !== null) {
		const ind = Math.round(helpers.bound(allStarGame, 0, 1) * tids.length);
		tids.splice(ind, 0, [-1, -2]);
	}

	if (settings?.notify && warning) {
		// console.log(g.get("season"), warning);
		logEvent(
			{
				type: "info",
				text: `Your <a href="${helpers.leagueUrl([
					"settings",
				])}">schedule settings (# Games, # Division Games, and # Conference Games)</a> combined with your teams/divs/confs cannot be handled by the schedule generator, so instead it will generate round robin matchups between all your teams. Message from the schedule generator: "${warning}" <a href="https://${WEBSITE_ROOT}/manual/customization/schedule-settings/" rel="noopener noreferrer" target="_blank">More details.</a>`,
				saveToDb: false,
			},
			settings.conditions,
		);
	}

	return tids;
};

export default newSchedule;
