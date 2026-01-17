import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import type { UpdateEvents } from "../../common/types.ts";
import { orderBy, range } from "../../common/utils.ts";

// Range includes both seasonStart and seasonEnd
export async function* iterateActivePlayersSeasonRange(
	seasonStart: number,
	seasonEnd: number,

	// "all" will return all active players each season. So a player who played 5 years in the range will be returned in 5 different players lists.
	// "unique" will only return the player once, the first time they appear. This is useful if you're computing career stats or something for these players, and filtering them so the end result doesn't include everyone. Then it's basically scanning all players who played in this range, without reading them all into memory at once.
	type: "all" | "unique",
) {
	// Start with players who were drafted before seasonStart - if seasonStart is startingSeason, this would be faster to use draftYear index only, but using activeSeason is faster if we're doing some arbitrary start that is not startingSeason
	let players = (
		await idb.getCopies.players(
			{
				activeSeason: seasonStart,
			},
			"noCopyCache",
		)
	).filter((p) => p.draft.year < seasonStart);

	for (let season = seasonStart; season <= seasonEnd; season++) {
		if (season > seasonStart) {
			const rookies = await idb.getCopies.players(
				{
					draftYear: season - 1,
				},
				"noCopyCache",
			);

			if (type === "all") {
				// Remove players who retired after the previous season
				players = players.filter((p) => p.retiredYear >= season);
			} else {
				// Remove all players, since last iteration would have already sent them through
				players = [];
			}

			players = [
				// Remove players who retired after the previous season
				...players.filter((p) => p.retiredYear >= season),

				// Add rookies
				...rookies,
			];
		}

		yield { players, season };
	}
}

const updateSeasons = async (
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
> => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement")
	) {
		const seasons: (number | undefined)[][] = [];
		let prevMinutesAll: Map<number, number>[] | undefined;

		// Start with players who were drafted before startingSeason - would be faster to use draftYear index only
		for await (const { players, season } of iterateActivePlayersSeasonRange(
			g.get("startingSeason"),
			g.get("season"),
			"all",
		)) {
			// Can't use getCopies.players easily because it doesn't elegantly handle when a player plays for two teams in a season
			const minutesAll = range(g.get("numTeams")).map(
				() => new Map<number, number>(),
			);

			for (const p of players) {
				for (const ps of p.stats) {
					if (ps.season === season && !ps.playoffs && minutesAll[ps.tid]) {
						const min = minutesAll[ps.tid]!.get(p.pid) ?? 0;
						minutesAll[ps.tid]!.set(p.pid, min + ps.min);
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
							const prevMinutes = prevMinutesAll[i]!;
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

		const abbrevs = g.get("teamInfoCache").map((t) => t.abbrev);

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
					(tid) => !tidsSorted.includes(tid),
				),
				(tid) => abbrevs[tid]!,
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
			const tidsSortedSeason = orderBy(remainingTids, (tid) => abbrevs[tid]!);
			tidsSorted.push(...tidsSortedSeason);
		}

		// Actually reorder all
		const abbrevsSorted = tidsSorted.map((tid) => abbrevs[tid]!);
		const seasonsSorted = seasons.map((season) =>
			tidsSorted.map((tid) => season[tid]),
		);

		seasonsSorted.reverse();

		return {
			abbrevs: abbrevsSorted,
			season: g.get("season"),
			seasons: seasonsSorted,
			userAbbrev: helpers.getAbbrev(g.get("userTid")),
		};
	}
};

export default updateSeasons;
