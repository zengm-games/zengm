const addDaysToSchedule = (
	games: {
		homeTid: number;
		awayTid: number;
	}[],
) => {
	const dayTids = new Set();
	let day = 1;
	let prevDayAllStarGame = false;

	return games.map(({ homeTid, awayTid }) => {
		const allStarGame = awayTid === -2 && homeTid === -1;
		if (
			dayTids.has(homeTid) ||
			dayTids.has(awayTid) ||
			allStarGame ||
			prevDayAllStarGame
		) {
			day += 1;
			dayTids.clear();
		}

		dayTids.add(homeTid);
		dayTids.add(awayTid);

		prevDayAllStarGame = allStarGame;

		return {
			homeTid,
			awayTid,
			day,
		};
	});
};

export default addDaysToSchedule;
