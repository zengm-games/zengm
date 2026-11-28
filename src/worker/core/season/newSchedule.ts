import { WEBSITE_ROOT } from "../../../common/constants.ts";
import type { Conditions } from "../../../common/types.ts";
import { g, helpers, logEvent } from "../../util/index.ts";
import { getRealSchedule } from "./getRealSchedule.football.ts";
import newScheduleGood from "./newScheduleGood.ts";
import {
	ALL_STAR_GAME_TIDS,
	TRADE_DEADLINE_TIDS,
} from "../../../common/specialGames.ts";

type ScheduleTeam = {
	seasonAttrs: {
		cid: number;
		did: number;
	};
	tid: number;
};

// Adds the trade deadline and All-Star Game to the regular season matchups, in place
const addSpecialGames = (tids: [number, number][]) => {
	// Add trade deadline
	const tradeDeadline = g.get("tradeDeadline");
	if (tradeDeadline < 1) {
		const ind = Math.round(tradeDeadline * tids.length);
		tids.splice(ind, 0, [...TRADE_DEADLINE_TIDS]);
	}

	// Add an All-Star Game
	const allStarGame = g.get("allStarGame");
	if (allStarGame !== null && allStarGame >= 0) {
		const ind = Math.round(allStarGame * tids.length);
		tids.splice(ind, 0, [...ALL_STAR_GAME_TIDS]);
	}
};

/**
 * The full regular season schedule as [homeTid, awayTid], including special games like the trade deadline and All-Star Game. warning is set if the schedule settings couldn't be met.
 */
export const genSchedule = (
	teams: ScheduleTeam[],
): { tids: [number, number][]; warning?: string } => {
	if (__SPORT === "football") {
		// Already includes special games, placed between days
		const tids = getRealSchedule(teams);
		if (tids) {
			return { tids };
		}
	}

	const { tids, warning } = newScheduleGood(teams);
	addSpecialGames(tids);
	return { tids, warning };
};

const newSchedule = (teams: ScheduleTeam[], conditions?: Conditions) => {
	const { tids, warning } = genSchedule(teams);

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
