import {
	PHASE,
	PLAYER,
	PLAYER_STATS_TABLES,
	getPlayerStatsTableStats,
} from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import type { PlayerStatType } from "../../common/types.ts";
import { defineView } from "../util/defineView.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { getBestPos } from "../core/player/checkJerseyNumberRetirement.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { getActivePlayoffTids } from "./playerRatings.ts";
import { last } from "../../common/utils.ts";
import { hasNonZeroStat } from "../../common/statValue.ts";

export default defineView(
	"playerStats",
	async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.includes("firstRun") ||
			(inputs.season === g.get("season") && updateEvents.includes("gameSim")) ||
			updateEvents.includes("playerMovement") ||
			inputs.abbrev !== prevInputs?.abbrev ||
			inputs.season !== prevInputs?.season ||
			inputs.statType !== prevInputs?.statType ||
			inputs.playoffs !== prevInputs?.playoffs
		) {
			let statsTable;

			if (__SPORT === "basketball") {
				if (inputs.statType === "advanced") {
					statsTable = PLAYER_STATS_TABLES.advanced;
				} else if (inputs.statType === "shotLocations") {
					statsTable = PLAYER_STATS_TABLES.shotLocations;
				} else if (inputs.statType === "gameHighs") {
					statsTable = PLAYER_STATS_TABLES.gameHighs;
				} else {
					statsTable = PLAYER_STATS_TABLES.regular;
				}
			} else {
				statsTable = PLAYER_STATS_TABLES[inputs.statType];
			}

			// TEMP DISABLE WITH ESLINT 9 UPGRADE eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
			if (!statsTable) {
				throw new Error(`Invalid statType: "${inputs.statType}"`);
			}

			const stats = statsTable.stats;
			let actualStats;
			if (inputs.season === "career") {
				actualStats = [
					...getPlayerStatsTableStats(stats),

					// Used in processPlayersHallOfFame
					bySport({
						baseball: "war",
						basketball: "ewa",
						football: "av",
						hockey: "ps",
					} as const),
				];
			} else {
				actualStats = getPlayerStatsTableStats(stats);
			}

			let playersAll;
			if (
				g.get("season") === inputs.season &&
				g.get("phase") <= PHASE.PLAYOFFS
			) {
				playersAll = await idb.cache.players.indexGetAll("playersByTid", [
					PLAYER.FREE_AGENT,
					Infinity,
				]);
			} else {
				playersAll = await idb.getCopies.players(
					{
						activeSeason:
							typeof inputs.season === "number" ? inputs.season : undefined,
					},
					"noCopyCache",
				);
			}

			let tid: number | undefined = g
				.get("teamInfoCache")
				.findIndex((t) => t.abbrev === inputs.abbrev);

			if (tid < 0) {
				tid = undefined;
			}

			let statType: PlayerStatType;
			if (__SPORT === "basketball") {
				if (inputs.statType === "totals") {
					statType = "totals";
				} else if (inputs.statType === "per36") {
					statType = "per36";
				} else {
					statType = "perGame";
				}
			} else {
				statType = "totals";
			}

			if (tid === undefined) {
				if (inputs.abbrev === "watch") {
					playersAll = playersAll.filter((p) => p.watch);
				} else if (inputs.abbrev === "playoffs") {
					const playoffTids = await getActivePlayoffTids();
					playersAll = playersAll.filter((p) => playoffTids.has(p.tid));
				}
			}

			const playersPlusOptions = {
				attrs: [
					"pid",
					"firstName",
					"lastName",
					"age",
					"born",
					"ageAtDeath",
					"injury",
					"tid",
					"abbrev",
					"hof",
					"watch",
					"awards",
				],
				ratings: ["skills", "pos", "season"],
				stats: ["abbrev", "tid", "jerseyNumber", "season", ...actualStats],
				tid,
				statType,
				seasonType: inputs.playoffs,
				mergeStats: "totOnly",
			} as const;

			// Normalize to one row per player (or per player season, for "all") with a single stats row, regardless of inputs.season
			let rows;
			if (typeof inputs.season === "number") {
				const players = await idb.getCopies.playersPlus(playersAll, {
					...playersPlusOptions,
					season: inputs.season,
				});
				rows = players.map(({ ratings, ...p }) => ({
					...p,
					pos: ratings.pos,
					skills: ratings.skills as string[] | undefined,
				}));
			} else {
				const players = await idb.getCopies.playersPlus(
					playersAll,
					playersPlusOptions,
				);

				if (inputs.season === "all") {
					rows = players.flatMap(
						({
							careerStats,
							careerStatsPlayoffs,
							careerStatsCombined,
							ratings: allRatings,
							stats: allStats,
							...p
						}) =>
							allStats.map((stats) => {
								const ratings =
									allRatings.find((pr) => pr.season === stats.season) ??
									last(allRatings);

								return {
									...p,
									pos: ratings.pos,
									skills: ratings.skills as string[] | undefined,
									stats,
								};
							}),
					);
				} else {
					rows = [];
					for (const {
						careerStats,
						careerStatsPlayoffs,
						careerStatsCombined,
						...p
					} of players) {
						const stats =
							inputs.playoffs === "playoffs"
								? careerStatsPlayoffs
								: inputs.playoffs === "combined"
									? careerStatsCombined
									: careerStats;
						if (!stats) {
							continue;
						}

						const { ratings, stats: allStats, ...pRest } = p;

						rows.push({
							...pRest,
							pos: getBestPos({ ratings, stats: allStats }, tid),
							skills: undefined,
							stats,
						});
					}
				}
			}

			// Only keep players who actually played
			if (inputs.abbrev !== "watch" && __SPORT === "basketball") {
				rows = rows.filter((p) => (p.stats.gp ?? 0) > 0);
			} else if (
				inputs.abbrev !== "watch" &&
				statsTable.onlyShowIf &&
				__SPORT !== "basketball"
			) {
				// Ensure some non-zero stat for this position
				const onlyShowIf = statsTable.onlyShowIf;

				rows = rows.filter((p) => {
					for (const stat of onlyShowIf) {
						if (hasNonZeroStat(p.stats[stat])) {
							return true;
						}
					}

					return false;
				});
			}

			const players = addFirstNameShort(rows);

			const superCols = helpers.deepCopy(statsTable.superCols);
			if (superCols && superCols[0]) {
				if (inputs.season === "all") {
					if (statsTable.superCols) {
						// Account for extra "Season" column
						superCols[0].colspan += 1;
					}
				}

				// # columns
				superCols[0].colspan += 1;
			}

			return {
				players,
				abbrev: inputs.abbrev,
				season: inputs.season,
				statType: inputs.statType,
				playoffs: inputs.playoffs,
				stats,
				superCols,
			};
		}
	},
);
