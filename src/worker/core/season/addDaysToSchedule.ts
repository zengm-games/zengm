import type { ScheduleGameWithoutKey } from "../../../common/types";

const addDaysToSchedule = (
	games: {
		homeTid: number;
		awayTid: number;
	}[],
): ScheduleGameWithoutKey[] => {
	const dayTids = new Set();
	let day = 1;
	let prevDayAllStarGame = false;
	let prevDayTradeDeadline = false;

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
