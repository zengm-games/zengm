import getSchedule from "./getSchedule";

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
		if (schedule.length > 0) {
			const today = schedule[0].day;

			let game;
			if (typeof target === "number") {
				game = schedule.find(game => game.gid === target);
			} else if (target === "allStarGame") {
				game = schedule.find(
					game => game.awayTid === -2 && game.homeTid === -1,
				);
			} else if (target === "tradeDeadline") {
				game = schedule.find(
					game => game.awayTid === -3 && game.homeTid === -3,
				);
			}

			if (game) {
				return game.day - today;
			}
		}

		throw new Error(`getDaysLeftSchedule did not find target "${target}"`);
	}

	if (schedule.length === 0) {
		return 0;
	}

	return schedule.at(-1).day - schedule[0].day + 1;
};

export default getDaysLeftSchedule;
