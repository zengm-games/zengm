import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents } from "../../common/types";
import { orderBy, range } from "../../common/utils";

async function updateSeasons(
	inputs: unknown,
	updateEvents: UpdateEvents,
): Promise<
	| {
			abbrevs: string[];
			season: number;
			seasons: (number | undefined)[][];
			userAbbrev: string;
	  }
	| undefined
> {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement")
	) {
		const seasons: (number | undefined)[][] = [];
		let prevMinutesAll: Map<number, number>[] | undefined;

		// Start with players who were drafted before startingSeason - would be faster to use draftYear index only
		const startingSeason = g.get("startingSeason");
		let players = (
			await idb.getCopies.players(
				{
					activeSeason: g.get("startingSeason"),
				},
				"noCopyCache",
			)
		).filter(p => p.draft.year < startingSeason);

		for (let season = startingSeason; season <= g.get("season"); season++) {
			if (season > startingSeason) {
				// Remove players who retired after the previous season
				players = players.filter(p => p.retiredYear >= season);

				// Add rookies
				const rookies = await idb.getCopies.players({
					draftYear: season - 1,
				});

				players.push(...rookies);
			}

			// Can't use getCopies.players easily because it doesn't elegantly handle when a player plays for two teams in a season
			const minutesAll = range(g.get("numTeams")).map(
				() => new Map<number, number>(),
			);

			for (const p of players) {
				for (const ps of p.stats) {
					if (ps.season === season && !ps.playoffs && minutesAll[ps.tid]) {
						const min = minutesAll[ps.tid].get(p.pid) ?? 0;
						minutesAll[ps.tid].set(p.pid, min + ps.min);
					}
				}
			}

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
								const teamSeasons = await idb.getCopies.teamSeasons(
									{
										tid: i,
										seasons: [season - 1, season],
									},
									"noCopyCache",
								);
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

		const abbrevs = g.get("teamInfoCache").map(t => t.abbrev);

		// Keep track of tids, sorted alphabetically by abbrev, adding any new ones (again sorted) to the end each year
		const tidsSorted: number[] = [];
		for (const season of seasons) {
			const tidsSortedSeasonSet = new Set<number>();
			for (let tid = 0; tid < season.length; tid++) {
				if (season[tid] !== undefined) {
					tidsSortedSeasonSet.add(tid);
				}
			}

			const tidsSortedSeason = orderBy(
				Array.from(tidsSortedSeasonSet).filter(
					tid => !tidsSorted.includes(tid),
				),
				tid => abbrevs[tid],
			);
			tidsSorted.push(...tidsSortedSeason);
		}

		const remainingTids = [];
		for (let tid = 0; tid < abbrevs.length; tid++) {
			if (!tidsSorted.includes(tid)) {
				remainingTids.push(tid);
			}
		}
		if (remainingTids.length > 0) {
			const tidsSortedSeason = orderBy(remainingTids, tid => abbrevs[tid]);
			tidsSorted.push(...tidsSortedSeason);
		}

		// Actually reorder all
		const abbrevsSorted = tidsSorted.map(tid => abbrevs[tid]);
		const seasonsSorted = seasons.map(season =>
			tidsSorted.map(tid => season[tid]),
		);

		seasonsSorted.reverse();

		return {
			abbrevs: abbrevsSorted,
			season: g.get("season"),
			seasons: seasonsSorted,
			userAbbrev: g.get("teamInfoCache")[g.get("userTid")].abbrev,
		};
	}
}

export default updateSeasons;
