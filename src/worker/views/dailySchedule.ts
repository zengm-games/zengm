import { season, team } from "../core";
import { idb } from "../db";
import { g, getProcessedGames } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	Game,
	ThenArg,
} from "../../common/types";
import { getUpcoming } from "./schedule";

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

		let upcoming: ThenArg<ReturnType<typeof getUpcoming>> = [];
		let isToday = false;

		if (inputs.season === g.get("season")) {
			// If it's the current season, get any upcoming games
			upcoming = await getUpcoming({
				day: inputs.day,
			});
		}

		let day = inputs.day ?? -1;
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

			const scheduleDay = schedule.filter(game => game.day === inputs.day);
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

		const completed = games.filter(game => game.day === inputs.day);

		const days = Array.from(daysSet).sort((a, b) => a - b);

		return {
			completed,
			day,
			days,
			isToday,
			season: inputs.season,
			upcoming,
		};
	}
};

export default updateDailySchedule;
