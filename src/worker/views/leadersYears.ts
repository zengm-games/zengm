import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import { groupByUnique, range } from "../../common/utils.ts";
import {
	GamesPlayedCache,
	getCategoriesAndStats,
	iterateAllPlayersWithStats,
	type Leader,
	leadersAddFirstNameShort,
	playerMeetsCategoryRequirements,
} from "./leaders.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { validateSeasonType } from "../util/processInputs.ts";
import { validateStatType } from "../util/processInputs.ts";
import { player } from "../core/index.ts";

export const processInputs = (
	params: RouteParams<"leadersProgressive"> | RouteParams<"leadersYears">,
) => {
	const defaultStat = bySport({
		baseball: "ba",
		basketball: "pts",
		football: "pssYds",
		hockey: "g",
	});

	return {
		stat: params.stat ?? defaultStat,
		playoffs: validateSeasonType(params.playoffs),
		statType: validateStatType(params.statType),
	};
};

const NUM_LEADERS = 10;

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

export default defineView({
	id: "leadersYears",
	processInputs,
	load: async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.has("firstRun") ||
			inputs.stat !== prevInputs?.stat ||
			inputs.playoffs !== prevInputs?.playoffs ||
			inputs.statType !== prevInputs?.statType
		) {
			const { categories: allCategories } = getCategoriesAndStats();
			const allStats = allCategories.map((cat) => cat.stat);

			const { categories, stats } = getCategoriesAndStats(inputs.stat);

			const cat = categories[0]!;

			const seasons = range(g.get("startingSeason"), g.get("season") + 1);

			let allLeaders = seasons
				.map((season) => ({
					season,
					linkSeason: false,
					leaders: [] as MyLeader[],
				}))
				.reverse();

			const awardsSeasons = new Set(
				await idb.merged.awards.getAll(undefined, { map: (row) => row.season }),
			);
			for (const row of allLeaders) {
				row.linkSeason = awardsSeasons.has(row.season);
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

			const formatOptions = {
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
				stats: ["tid", ...stats],
				seasonType: inputs.playoffs,
				mergeStats: "totOnly",
				statType: inputs.statType,
			} as const;
			const abbrevs = await player.loadAbbrevs(formatOptions);
			const createSeasonFormatter = (season: number) =>
				player.createFormatter({ ...formatOptions, season }, abbrevs);
			const seasonFormatters = new Map<
				number,
				ReturnType<typeof createSeasonFormatter>
			>();

			await iterateAllPlayersWithStats("all", (pRaw, season) => {
				if (typeof season !== "number") {
					throw new Error("Invalid season");
				}

				const current = leadersBySeason[season];
				if (!current) {
					return;
				}

				const formatSeason = seasonFormatters.getOrInsertComputed(
					season,
					createSeasonFormatter,
				);
				const p = formatSeason(pRaw);
				if (!p) {
					return;
				}

				const value = p.stats[cat.stat];
				if (typeof value !== "number") {
					// value should only be undefined in historical data before certain stats were tracked. Leader categories are all numeric stats
					return;
				}

				const lastValue = current.leaders.at(-1)?.stat;
				if (
					lastValue !== undefined &&
					current.leaders.length >= NUM_LEADERS &&
					((cat.sortAscending && value > lastValue) ||
						(!cat.sortAscending && value < lastValue))
				) {
					// Value is not good enough for the top 10
					return;
				}

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
					const leader = {
						hof: p.hof,
						key: p.pid,
						firstName: p.firstName,
						lastName: p.lastName,
						pid: p.pid,
						stat: value,
						userTeam: g.get("userTid", season) === p.stats.tid,
						watch: p.watch,
					};

					current.leaders = current.leaders.slice(0, NUM_LEADERS - 1);
					current.leaders.push(leader);
					if (cat.sortAscending) {
						current.leaders.sort((a, b) => a.stat - b.stat);
					} else {
						current.leaders.sort((a, b) => b.stat - a.stat);
					}
				}
			});

			allLeaders = allLeaders.filter((row) => row.leaders.length > 0);

			return {
				allLeaders: leadersAddFirstNameShort(allLeaders),
				playoffs: inputs.playoffs,
				stat: inputs.stat,
				statType: inputs.statType,
				stats: allStats,
			};
		}
	},
});
