import getSchedule from "./getSchedule.ts";
import {
	isAllStarGame,
	isTradeDeadline,
} from "../../../common/specialGames.ts";

/**
 * Get the number of days left in the regular season schedule.
 *
 * @memberOf core.season
 * @return {Promise} The number of days left in the schedule.
 */
const getDaysLeftSchedule = async (
	target?: number | "allStarGame" | "tradeDeadline",
) => {
	const schedule = await getSchedule();

	if (target !== undefined) {
		if (schedule[0]) {
			const today = schedule[0].day;

			let game;
			if (typeof target === "number") {
				game = schedule.find((game) => game.gid === target);
			} else if (target === "allStarGame") {
				game = schedule.find((game) =>
					isAllStarGame(game.homeTid, game.awayTid),
				);
			} else if (target === "tradeDeadline") {
				game = schedule.find((game) =>
					isTradeDeadline(game.homeTid, game.awayTid),
				);
			}

			if (game) {
				return game.day - today;
			}
		}

		throw new Error(`getDaysLeftSchedule did not find target "${target}"`);
	}

	if (!schedule[0]) {
		return 0;
	}

	return schedule.at(-1)!.day - schedule[0].day + 1;
};

export default getDaysLeftSchedule;
