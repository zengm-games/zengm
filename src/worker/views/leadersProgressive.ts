import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { groupByUnique } from "../../common/groupBy";
import range from "lodash-es/range";
import {
	GamesPlayedCache,
	getCategoriesAndStats,
	iterateAllPlayers,
	type Leader,
	playerMeetsCategoryRequirements,
} from "./leaders";
import addFirstNameShort from "../util/addFirstNameShort";

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
			.map(row => categories.map(category => row[category]))
			.flat()
			.filter(row => row !== undefined) as MyLeader[],
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
			linkSeason: false,
			yearByYear: undefined as MyLeader | undefined,
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
					"firstName",
					"lastName",
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
				mergeStats: "totOnly" as const,
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
							career: false,
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
								jerseyNumber: p.jerseyNumber,
								key: p.pid,
								firstName: p.firstName,
								lastName: p.lastName,
								pid: p.pid,
								skills: p.ratings.skills,
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
				const filteredStats = pRaw.stats.filter(row => row.season <= season);

				const p = await idb.getCopy.playersPlus(
					{
						...pRaw,
						stats: filteredStats,
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

					const pass = playerMeetsCategoryRequirements({
						career: true,
						cat,
						gamesPlayedCache,
						p,
						playerStats,
						playoffs,
						season,
						statType: inputs.statType,
					});

					if (pass) {
						const value = playerStats[cat.stat];
						const leader = {
							hof: p.hof,
							jerseyNumber: p.jerseyNumber,
							key: p.pid,
							firstName: p.firstName,
							lastName: p.lastName,
							pid: p.pid,
							skills: p.ratings.skills,
							stat: playerStats[cat.stat],
							userTeam: g.get("userTid", season) === p.stats.tid,
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
							new Set(pRaw.stats.map(row => row.season)),
						).sort((a, b) => a - b);
						const nextSeason = allSeasons.find(season2 => season2 > season);
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
							const lastValue = allLeaders[i].career?.stat;
							if (
								lastValue === undefined ||
								(cat.sortAscending && value < lastValue) ||
								(!cat.sortAscending && value > lastValue)
							) {
								allLeaders[i].career = leader;
							}

							if (allLeaders[i].season === maxSeasonCareer) {
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

		allLeaders = allLeaders.filter(row => row.yearByYear);
		leadersProgressiveAddFirstNameShort(allLeaders);

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
