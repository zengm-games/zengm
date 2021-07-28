import type { Game, ScheduleGameWithoutKey } from "../../../common/types";
import { g } from "../../util";

const addDaysToSchedule = (
	games: {
		homeTid: number;
		awayTid: number;
	}[],
	existingGames?: Game[],
): ScheduleGameWithoutKey[] => {
	const dayTids = new Set();
	let prevDayAllStarGame = false;
	let prevDayTradeDeadline = false;

	let day = 1;

	// If there are other games in already played this season, start after that day
	if (existingGames) {
		const season = g.get("season");
		for (const game of existingGames) {
			if (
				game.season === season &&
				typeof game.day === "number" &&
				game.day >= day
			) {
				day = game.day + 1;
			}
		}
	}

	return games.map(({ homeTid, awayTid }) => {
		const allStarGame = awayTid === -2 && homeTid === -1;
		const tradeDeadline = awayTid === -3 && homeTid === -3;
		if (
			dayTids.has(homeTid) ||
			dayTids.has(awayTid) ||
			allStarGame ||
			prevDayAllStarGame ||
			tradeDeadline ||
			prevDayTradeDeadline
		) {
			day += 1;
			dayTids.clear();
		}

		dayTids.add(homeTid);
		dayTids.add(awayTid);

		prevDayAllStarGame = allStarGame;
		prevDayTradeDeadline = tradeDeadline;

		return {
			homeTid,
			awayTid,
			day,
		};
	});
};

export default addDaysToSchedule;
