import { season, team } from "../core";
import { idb } from "../db";
import { g } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	Game,
	ThenArg,
} from "../../common/types";
import { getUpcoming } from "./schedule";

let prevInputsDay: number | undefined;
const updateDailySchedule = async (
	inputs: ViewInput<"dailySchedule">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase") ||
		inputs.season !== state.season ||
		inputs.day !== state.day
	) {
		const games = await idb.getCopies.games({
			season: inputs.season,
		});

		const daysSet = new Set<number>();
		for (const game of games) {
			if (game.day !== undefined) {
				daysSet.add(game.day);
			}
		}

		let isToday = false;

		// What day is it? Get it from URL by default, but that could be undefined
		let day = inputs.day ?? -1;
		if (day === -1) {
			if (updateEvents.includes("firstRun")) {
				// If this is a new load of the view, initialize to the current day (current season) or day 1 (past season)
				day = -1;
			} else if (prevInputsDay !== undefined) {
				// If this is a refresh and we're moving from day in URL to no day in URL, go to current day (current season) or day 1 (past season)
				day = -1;
			} else if (state.day !== undefined) {
				// If this is a refresh and we already had a day loaded even with no day in the URL, keep that day the same
				day = state.day;
			}
		}

		prevInputsDay = inputs.day;

		if (inputs.season === g.get("season")) {
			const schedule = await season.getSchedule();

			if (day === -1) {
				if (schedule.length > 0 && schedule[0].day !== undefined) {
					day = schedule[0].day;
				}
			}
			if (day === -1) {
				day = 1;
			}

			const scheduleDay = schedule.filter(game => game.day === day);
			isToday =
				scheduleDay.length > 0 && schedule[0].gid === scheduleDay[0].gid;
			for (const game of schedule) {
				if (game.day !== undefined) {
					daysSet.add(game.day);
				}
			}
		} else {
			if (day === -1) {
				day = 1;
			}
		}

		const completed = games.filter(game => game.day === day);

		let upcoming: ThenArg<ReturnType<typeof getUpcoming>> = [];
		if (inputs.season === g.get("season")) {
			// If it's the current season, get any upcoming games
			upcoming = await getUpcoming({
				day,
			});
		}

		const days = Array.from(daysSet).sort((a, b) => a - b);

		return {
			completed,
			day,
			days,
			isToday,
			season: inputs.season,
			upcoming,
			userTid: g.get("userTid"),
		};
	}
};

export default updateDailySchedule;
