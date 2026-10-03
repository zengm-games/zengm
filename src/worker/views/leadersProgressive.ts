import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import { groupByUnique, range } from "../../common/utils.ts";
import {
	GamesPlayedCache,
	getCategoriesAndStats,
	iterateAllPlayersWithStats,
	type Leader,
	playerMeetsCategoryRequirements,
} from "./leaders.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { getNumericStat } from "../../common/statValue.ts";

type MyLeader = Omit<
	Leader,
	"abbrev" | "pos" | "injury" | "retiredYear" | "tid" | "season"
>;

const leadersProgressiveAddFirstNameShort = (
	rows: {
		yearByYear: MyLeader | undefined;
		active: MyLeader | undefined;
		career: MyLeader | undefined;
		singleSeason: MyLeader | undefined;
	}[],
) => {
	const categories = [
		"yearByYear",
		"active",
		"career",
		"singleSeason",
	] as const;
	const players = addFirstNameShort(
		rows
			.flatMap((row) => categories.map((category) => row[category]))
			.filter((row) => row !== undefined) as MyLeader[],
	);

	let i = 0;
	for (const row of rows) {
		for (const category of categories) {
			if (row[category]) {
				row[category] = players[i];
				i += 1;
			}
		}
	}
};

export default defineView(
	"leadersProgressive",
	async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.includes("firstRun") ||
			inputs.stat !== prevInputs?.stat ||
			inputs.playoffs !== prevInputs?.playoffs ||
			inputs.statType !== prevInputs?.statType
		) {
			const { categories: allCategories } = getCategoriesAndStats();
			const allStats = allCategories.map((cat) => cat.stat);

			const { categories, stats } = getCategoriesAndStats(inputs.stat);

			const cat = categories[0]!;

			const seasons = range(g.get("startingSeason"), g.get("season") + 1);

			let allLeaders = seasons.map((season) => ({
				season,
				linkSeason: false,
				yearByYear: undefined as (MyLeader & { count: number }) | undefined,
				active: undefined as MyLeader | undefined,
				career: undefined as MyLeader | undefined,
				singleSeason: undefined as MyLeader | undefined,
			}));

			for (const row of allLeaders) {
				const awards = await idb.getCopy.awards({
					season: row.season,
				});
				if (awards) {
					row.linkSeason = true;
				}
			}

			const leadersBySeason = groupByUnique(allLeaders, "season");

			const gamesPlayedCache = new GamesPlayedCache();
			if (inputs.playoffs === "combined") {
				await gamesPlayedCache.loadSeasons(seasons, false);
				await gamesPlayedCache.loadSeasons(seasons, true);
			} else {
				await gamesPlayedCache.loadSeasons(
					seasons,
					inputs.playoffs === "playoffs",
				);
			}

			await iterateAllPlayersWithStats("all", async (pRaw, season) => {
				if (typeof season !== "number") {
					throw new Error("Invalid season");
				}

				const current = leadersBySeason[season];
				if (!current) {
					return;
				}

				const playersPlusArgs = {
					attrs: [
						"pid",
						"firstName",
						"lastName",
						"injury",
						"watch",
						"jerseyNumber",
						"hof",
						"retiredYear",
					],
					ratings: ["skills", "pos"],
					// season is for finding the team in the career stats rows
					stats: ["abbrev", "season", "tid", ...stats],
					seasonType: inputs.playoffs,
					mergeStats: "totOnly",
					statType: inputs.statType,
					disableAbbrevsCacheDatabaseAccess: true,
				} as const;

				{
					// Single season stats
					const p = await idb.getCopy.playersPlus(pRaw, {
						...playersPlusArgs,
						season,
					});
					if (p) {
						const value = p.stats[cat.stat];
						if (typeof value !== "number") {
							// value should only be undefined in historical data before certain stats were tracked. Leader categories are all numeric stats
							return;
						}

						const lastValue = current.yearByYear?.stat;
						if (
							lastValue === undefined ||
							(cat.sortAscending && value < lastValue) ||
							(!cat.sortAscending && value > lastValue)
						) {
							const pass = playerMeetsCategoryRequirements({
								career: false,
								cat,
								gamesPlayedCache,
								p,
								playerStats: p.stats,
								seasonType: inputs.playoffs,
								season,
								statType: inputs.statType,
							});

							if (pass) {
								current.yearByYear = {
									hof: p.hof,
									jerseyNumber: p.jerseyNumber,
									key: p.pid,
									firstName: p.firstName,
									lastName: p.lastName,
									pid: p.pid,
									skills: p.ratings.skills,
									stat: value,
									userTeam: g.get("userTid", season) === p.stats.tid,
									watch: p.watch,
									count: 0,
								};
							}
						}
					}
				}

				{
					// Career stats up to this season
					const filteredStats = pRaw.stats.filter(
						(row) => row.season <= season,
					);

					const p = await idb.getCopy.playersPlus(
						{
							...pRaw,
							stats: filteredStats,
						},
						playersPlusArgs,
					);
					let playerStats;
					if (p) {
						if (inputs.playoffs === "playoffs") {
							playerStats = p.careerStatsPlayoffs;
						} else if (inputs.playoffs === "combined") {
							playerStats = p.careerStatsCombined;
						} else {
							playerStats = p.careerStats;
						}
					}
					// value should only be undefined in historical data before certain stats were tracked. Leader categories are all numeric stats
					const value = getNumericStat(playerStats?.[cat.stat]);
					if (p && playerStats && value !== undefined) {
						const pass = playerMeetsCategoryRequirements({
							career: true,
							cat,
							gamesPlayedCache,
							p,
							playerStats,
							seasonType: inputs.playoffs,
							season,
							statType: inputs.statType,
						});

						if (pass) {
							// Team for this season, since p.stats has all seasons up to this one
							const tid = p.stats.findLast((row) => row.season === season)?.tid;

							const leader = {
								hof: p.hof,
								jerseyNumber: p.jerseyNumber,
								key: p.pid,
								firstName: p.firstName,
								lastName: p.lastName,
								pid: p.pid,
								skills: undefined,
								stat: value,
								userTeam: g.get("userTid", season) === tid,
								watch: p.watch,
							};

							// Update active
							const lastValue = current.active?.stat;
							if (
								lastValue === undefined ||
								(cat.sortAscending && value < lastValue) ||
								(!cat.sortAscending && value > lastValue)
							) {
								current.active = leader;
							}

							// Update career
							// For "active", consider up to the current season. For "career", also consider values for retired players or players who are not playing this year but will play again later. To do this, get `maxSeasonCareer`, which is the maximum season up to which this player's career total for this `season` can apply.
							const allSeasons: number[] = Array.from(
								new Set(pRaw.stats.map((row) => row.season)),
							).sort((a, b) => a - b);
							const nextSeason = allSeasons.find((season2) => season2 > season);
							let maxSeasonCareer;
							if (nextSeason === undefined) {
								// Last year of this player - so can apply this to any season
								maxSeasonCareer = Infinity;
							} else {
								// Anything before nextSeason works - this includes gap years!
								maxSeasonCareer = nextSeason - 1;
							}

							const startIndex = allLeaders.indexOf(current);
							for (let i = startIndex; i < allLeaders.length; i++) {
								const lastValue = allLeaders[i]!.career?.stat;
								if (
									lastValue === undefined ||
									(cat.sortAscending && value < lastValue) ||
									(!cat.sortAscending && value > lastValue)
								) {
									allLeaders[i]!.career = leader;
								}

								if (allLeaders[i]!.season === maxSeasonCareer) {
									break;
								}
							}
						}
					}
				}
			});

			let runningLeader: MyLeader | undefined;
			for (const row of allLeaders) {
				if (row.yearByYear) {
					const lastValue = runningLeader?.stat;
					const value = row.yearByYear.stat;
					if (
						lastValue === undefined ||
						(cat.sortAscending && value < lastValue) ||
						(!cat.sortAscending && value > lastValue)
					) {
						runningLeader = row.yearByYear;
					}
					row.singleSeason = runningLeader;
				}
			}

			allLeaders = allLeaders.filter((row) => row.yearByYear);
			leadersProgressiveAddFirstNameShort(allLeaders);

			const yearByYearCounts: Record<number, number> = {};
			for (const row of allLeaders) {
				if (!row.yearByYear) {
					continue;
				}

				yearByYearCounts[row.yearByYear.pid] ??= 0;
				yearByYearCounts[row.yearByYear.pid]! += 1;

				row.yearByYear.count = yearByYearCounts[row.yearByYear.pid]!;
			}

			return {
				allLeaders,
				playoffs: inputs.playoffs,
				stat: inputs.stat,
				statType: inputs.statType,
				stats: allStats,
			};
		}
	},
);
