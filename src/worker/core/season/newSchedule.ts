import { isSport, WEBSITE_ROOT } from "../../../common/index.ts";
import type { Conditions } from "../../../common/types.ts";
import { g, helpers, logEvent } from "../../util/index.ts";
import { getRealSchedule } from "./getRealSchedule.football.ts";
import newScheduleGood from "./newScheduleGood.ts";

const newSchedule = async (
	teams: {
		seasonAttrs: {
			cid: number;
			did: number;
		};
		tid: number;
	}[],
	conditions?: Conditions,
) => {
	if (isSport("football")) {
		const tids = await getRealSchedule(teams);
		if (tids) {
			return tids;
		}
	}

	const { tids, warning } = newScheduleGood(teams);

	// Add trade deadline
	const tradeDeadline = g.get("tradeDeadline");
	if (tradeDeadline < 1) {
		const ind = Math.round(tradeDeadline * tids.length);
		tids.splice(ind, 0, [-3, -3]);
	}

	// Add an All-Star Game
	const allStarGame = g.get("allStarGame");
	if (allStarGame !== null && allStarGame >= 0) {
		const ind = Math.round(allStarGame * tids.length);
		tids.splice(ind, 0, [-1, -2]);
	}

	if (warning !== undefined) {
		// console.log(g.get("season"), warning);
		logEvent(
			{
				type: "info",
				text: `Your <a href="${helpers.leagueUrl([
					"settings",
				])}">schedule settings (# Games, # Division Games, and # Conference Games)</a> combined with your teams/divs/confs cannot be handled by the schedule generator, so instead it will generate round robin matchups between all your teams. Message from the schedule generator: "${warning}" <a href="https://${WEBSITE_ROOT}/manual/customization/schedule-settings/" target="_blank">More details.</a>`,
				saveToDb: false,
			},
			conditions,
		);
	}

	return tids;
};

export default newSchedule;
