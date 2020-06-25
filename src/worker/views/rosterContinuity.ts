import range from "lodash/range";
import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents } from "../../common/types";

async function updateSeasons(
	inputs: unknown,
	updateEvents: UpdateEvents,
): Promise<{
	abbrevs: string[];
	season: number;
	seasons: (number | undefined)[][];
	userTid: number;
} | void> {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement")
	) {
		const seasons: (number | undefined)[][] = [];
		let prevMinutesAll: Map<number, number>[] | undefined;

		for (
			let season = g.get("startingSeason");
			season <= g.get("season");
			season++
		) {
			const players = await idb.getCopies.players({
				activeSeason: season,
			});

			// Can't use getCopies.players easily because it doesn't elegantly handle when a player plays for two teams in a season
			const minutesAll = range(g.get("numTeams")).map(
				() => new Map<number, number>(),
			);

			for (const p of players) {
				const stats = p.stats.filter(
					ps => !ps.playoffs && ps.season === season,
				);

				for (const ps of stats) {
					// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
					if (minutesAll[ps.tid]) {
						// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
						const min = minutesAll[ps.tid].get(p.pid) || 0;
						minutesAll[ps.tid].set(p.pid, min + ps.min);
					}
				}
			}

			// @ts-ignore
			if (prevMinutesAll) {
				// compare against previous season
				seasons.push(
					await Promise.all(
						minutesAll.map(async (minutes, i) => {
							if (!prevMinutesAll) {
								throw new Error("undefined prevMinutesAll");
							}
							const prevMinutes = prevMinutesAll[i];
							let sumMinutes = 0;
							let sumMinutesContinuity = 0;

							for (const [pid, min] of minutes) {
								sumMinutes += min;

								if (prevMinutes.has(pid)) {
									sumMinutesContinuity += min;
								}
							}

							if (sumMinutesContinuity === 0) {
								// Is it really 0, or did team not exist for one of these seasons?
								const teamSeasons = await idb.getCopies.teamSeasons({
									tid: i,
									seasons: [season - 1, season],
								});
								if (teamSeasons.length < 2) {
									return undefined;
								}
							}

							if (sumMinutes === 0) {
								// Season probably hasn't started yet
								return 1;
							}

							return sumMinutesContinuity / sumMinutes;
						}),
					),
				);
			}
			prevMinutesAll = minutesAll;
		}

		seasons.reverse();

		return {
			abbrevs: g.get("teamInfoCache").map(t => t.abbrev),
			season: g.get("season"),
			seasons,
			userTid: g.get("userTid"),
		};
	}
}

export default updateSeasons;
