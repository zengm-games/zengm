import getSchedule from "./getSchedule";

/**
 * Get the number of days left in the regular season schedule.
 *
 * @memberOf core.season
 * @return {Promise} The number of days left in the schedule.
 */
const getDaysLeftSchedule = async (target?: number | "allStarGame") => {
	const schedule = await getSchedule();
	let numDays = 0;
	let iPrev = 0;

	while (iPrev < schedule.length) {
		// Only take the games up until right before a team plays for the second time that day
		const tids: number[] = [];
		let i;

		for (i = iPrev; i < schedule.length; i++) {
			const { awayTid, homeTid, gid } = schedule[i]; // All-Star Game

			if (awayTid === -2 && homeTid === -1) {
				// Add one to represent that the "current day" of games before the ASG ended. Then the normal +1 at the end of the while loop will account for the ASG itself
				numDays += 1;

				if (target === "allStarGame") {
					return numDays;
				}

				i += 1;
				break;
			}

			if (target === gid) {
				// How many days are there before the day including this game? Need to add 1 if this game would be the first entry in a new day
				if (tids.includes(homeTid) || tids.includes(awayTid)) {
					numDays += 1;
				}
				return numDays;
			}

			if (!tids.includes(homeTid) && !tids.includes(awayTid)) {
				tids.push(homeTid);
				tids.push(awayTid);
			} else {
				break;
			}
		}

		iPrev = i;
		numDays += 1;
	}

	if (target !== undefined) {
		throw new Error(`getDaysLeftSchedule did not find target "${target}"`);
	}

	return numDays;
};

export default getDaysLeftSchedule;
