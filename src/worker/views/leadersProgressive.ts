import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { groupByUnique } from "../../common/groupBy";
import range from "lodash-es/range";
import {
	GamesPlayedCache,
	getCategoriesAndStats,
	iterateAllPlayers,
	Leader,
	playerMeetsCategoryRequirements,
} from "./leaders";

type MyLeader = Omit<
	Leader,
	| "abbrev"
	| "jerseyNumber"
	| "pos"
	| "injury"
	| "retiredYear"
	| "skills"
	| "tid"
	| "season"
>;

const updateLeadersProgressive = async (
	inputs: ViewInput<"leadersProgressive">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	// Respond to watchList in case players are listed twice in different categories
	if (
		updateEvents.includes("watchList") ||
		inputs.stat !== state.stat ||
		inputs.playoffs !== state.playoffs ||
		inputs.statType !== state.statType
	) {
		const { categories: allCategories } = getCategoriesAndStats();
		const allStats = allCategories.map(cat => cat.stat);

		const { categories, stats } = getCategoriesAndStats(inputs.stat);
		const playoffs = inputs.playoffs === "playoffs";

		const cat = categories[0];

		const seasons = range(g.get("startingSeason"), g.get("season") + 1);

		let allLeaders = seasons.map(season => ({
			season,
			yearByYear: undefined as MyLeader | undefined,
			active: undefined as MyLeader | undefined,
			career: undefined as MyLeader | undefined,
			singleSeason: undefined as MyLeader | undefined,
		}));

		const leadersBySeason = groupByUnique(allLeaders, "season");

		const gamesPlayedCache = new GamesPlayedCache();
		await gamesPlayedCache.loadSeasons(seasons, playoffs);

		await iterateAllPlayers("all", async (pRaw, season) => {
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
					"nameAbbrev",
					"injury",
					"watch",
					"jerseyNumber",
					"hof",
					"retiredYear",
				],
				ratings: ["skills", "pos"],
				stats: ["abbrev", "tid", ...stats],
				playoffs,
				regularSeason: !playoffs,
				mergeStats: true,
				statType: inputs.statType,
			};

			{
				// Single season stats
				const p = await idb.getCopy.playersPlus(pRaw, {
					...playersPlusArgs,
					season,
				});
				if (p) {
					const value = p.stats[cat.stat];
					const lastValue = current.yearByYear?.stat;
					if (
						lastValue === undefined ||
						(cat.sortAscending && value < lastValue) ||
						(!cat.sortAscending && value > lastValue)
					) {
						const pass = playerMeetsCategoryRequirements({
							cat,
							gamesPlayedCache,
							p,
							playerStats: p.stats,
							playoffs,
							season,
							statType: inputs.statType,
						});

						if (pass) {
							current.yearByYear = {
								hof: p.hof,
								key: p.pid,
								nameAbbrev: p.nameAbbrev,
								pid: p.pid,
								stat: p.stats[cat.stat],
								userTeam: g.get("userTid", season) === p.stats.tid,
								watch: p.watch,
							};
						}
					}
				}
			}

			{
				// Career stats up to this season
				const p = await idb.getCopy.playersPlus(
					{
						...pRaw,
						stats: pRaw.stats.filter(row => row.season <= season),
					},
					playersPlusArgs,
				);
				if (p) {
					// Shitty handling of career totals
					p.ratings = {
						pos: p.ratings.at(-1).pos,
						skills: [],
					};

					let playerStats;
					if (playoffs) {
						playerStats = p.careerStatsPlayoffs;
					} else {
						playerStats = p.careerStats;
					}

					const value = playerStats[cat.stat];
					const lastValue = current.active?.stat;
					if (pRaw.pid === 1285) {
						console.log(season, p, value, lastValue);
					}
					if (
						lastValue === undefined ||
						(cat.sortAscending && value < lastValue) ||
						(!cat.sortAscending && value > lastValue)
					) {
						const pass = playerMeetsCategoryRequirements({
							cat,
							gamesPlayedCache,
							p,
							playerStats,
							playoffs,
							season,
							statType: inputs.statType,
						});
						if (pRaw.pid === 1285) {
							console.log(season, p, value, lastValue, pass);
						}

						if (pass) {
							current.active = {
								hof: p.hof,
								key: p.pid,
								nameAbbrev: p.nameAbbrev,
								pid: p.pid,
								stat: playerStats[cat.stat],
								userTeam: g.get("userTid", season) === p.stats.tid,
								watch: p.watch,
							};
						}
					}
				}
			}
		});

		type LeaderType = Exclude<keyof typeof allLeaders[number], "season">;
		const runningMaxes: {
			from: LeaderType;
			to: LeaderType;
		}[] = [
			{
				from: "yearByYear",
				to: "singleSeason",
			},
			{
				from: "active",
				to: "career",
			},
		];
		for (const { from, to } of runningMaxes) {
			let runningLeader: MyLeader | undefined;
			for (const row of allLeaders) {
				const pFrom = row[from];
				if (pFrom) {
					const lastValue = runningLeader?.stat;
					const value = pFrom.stat;
					if (
						lastValue === undefined ||
						(cat.sortAscending && value < lastValue) ||
						(!cat.sortAscending && value > lastValue)
					) {
						runningLeader = pFrom;
					}
					row[to] = runningLeader;
				}
			}
		}

		allLeaders = allLeaders.filter(row => row.yearByYear);

		return {
			allLeaders,
			playoffs: inputs.playoffs,
			stat: inputs.stat,
			statType: inputs.statType,
			stats: allStats,
		};
	}
};

export default updateLeadersProgressive;
