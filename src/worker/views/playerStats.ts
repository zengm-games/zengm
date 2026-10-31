import {
	PLAYER_STATS_TABLES,
	getPlayerStatsTableStats,
} from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import {
	getActiveSeasonSelector,
	type PlayersSelector,
} from "../db/merged/players.ts";
import { g, helpers } from "../util/index.ts";
import type { Player, PlayerStatType } from "../../common/types.ts";
import { defineView } from "../util/defineView.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { getBestPos } from "../core/player/checkJerseyNumberRetirement.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { getActivePlayoffTids } from "./playerRatings.ts";
import { last } from "../../common/utils.ts";
import { hasNonZeroStat } from "../../common/statValue.ts";
import { REMAINING_PLAYOFF_TEAMS_PHASES } from "../../common/constants.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { actualPhase } from "../util/actualPhase.ts";
import { validateAbbrev } from "../util/processInputs.ts";
import { validateSeason } from "../util/processInputs.ts";
import { validateSeasonType } from "../util/processInputs.ts";
import { player } from "../core/index.ts";

const processInputs = (params: RouteParams<"playerStats">) => {
	let abbrev;

	const [, validatedAbbrev] = validateAbbrev(params.abbrev, true);

	if (params.abbrev !== undefined && validatedAbbrev !== "???") {
		abbrev = validatedAbbrev;
	} else if (params.abbrev === "watch") {
		abbrev = "watch";
	} else if (
		params.abbrev === "playoffs" &&
		REMAINING_PLAYOFF_TEAMS_PHASES.has(actualPhase())
	) {
		abbrev = "playoffs";
	} else {
		abbrev = "all";
	}

	const defaultStatType = bySport({
		baseball: "batting",
		basketball: "perGame",
		football: "passing",
		hockey: "skater",
	});

	let season: "career" | "all" | number;
	if (params.season === "career" || params.season === "all") {
		season = params.season;
	} else {
		season = validateSeason(params.season);
	}

	let statType = params.statType ?? defaultStatType;

	// Handle upgrade without breaking URLs
	if (__SPORT === "football" && statType === "rushing") {
		statType = "rushingReceiving";
	}

	return {
		abbrev,
		season,
		statType,
		playoffs: validateSeasonType(params.playoffs),
	};
};

export default defineView({
	id: "playerStats",
	processInputs,
	load: async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.has("firstRun") ||
			(inputs.season === g.get("season") && updateEvents.has("gameSim")) ||
			updateEvents.has("playerMovement") ||
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

			let tid: number | undefined = g
				.get("teamInfoCache")
				.findIndex((t) => t.abbrev === inputs.abbrev);

			if (tid < 0) {
				tid = undefined;
			}

			// Applied while reading players, so players who won't be shown are not all held in memory. For a team, this keeps anyone with any stats for that team, and formatting does the exact filtering.
			let filter: ((p: Player) => boolean) | undefined;
			if (tid !== undefined) {
				const season = inputs.season;
				filter = (p) =>
					p.stats.some(
						(ps) =>
							ps.tid === tid &&
							(typeof season !== "number" || ps.season === season),
					);
			} else if (inputs.abbrev === "watch") {
				filter = (p) => p.watch !== undefined;
			} else if (inputs.abbrev === "playoffs") {
				const playoffTids = await getActivePlayoffTids();
				filter = (p) => playoffTids.has(p.tid);
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

			const formatOptions = {
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

			// Reads players and turns each one into rows, using getRows to format the player. This runs while reading players, so the full player objects are not all held in memory at once.
			const readRows = async <Row>(getRows: (p: Player) => Row[]) => {
				let selector: PlayersSelector | undefined;
				if (typeof inputs.season === "number") {
					selector = getActiveSeasonSelector(inputs.season);
				} else if (inputs.abbrev === "watch") {
					// Only read players on the watch list, rather than all players
					selector = { watch: true };
				}

				const rowsByPlayer = await idb.merged.players.getAll(selector, {
					filter,
					map: getRows,
				});
				const rows: Row[] = [];
				for (const playerRows of rowsByPlayer) {
					rows.push(...playerRows);
				}
				return rows;
			};

			// Normalize to one row per player (or per player season, for "all") with a single stats row, regardless of inputs.season
			let rows;
			if (typeof inputs.season === "number") {
				const seasonFormatOptions = {
					...formatOptions,
					season: inputs.season,
				};
				const abbrevs = await player.loadAbbrevs(seasonFormatOptions);
				const formatPlayer = player.createFormatter(
					seasonFormatOptions,
					abbrevs,
				);
				rows = await readRows((pRaw) => {
					const p = formatPlayer(pRaw);
					if (!p) {
						return [];
					}

					const { ratings, ...pRest } = p;
					return [
						{
							...pRest,
							pos: ratings.pos,
							skills: ratings.skills,
						},
					];
				});
			} else {
				const abbrevs = await player.loadAbbrevs(formatOptions);
				const formatPlayer = player.createFormatter(formatOptions, abbrevs);

				if (inputs.season === "all") {
					rows = await readRows((pRaw) => {
						const p = formatPlayer(pRaw);
						if (!p) {
							return [];
						}

						const {
							careerStats,
							careerStatsPlayoffs,
							careerStatsCombined,
							ratings: allRatings,
							stats: allStats,
							...pRest
						} = p;
						return allStats.map((stats) => {
							const ratings =
								allRatings.find((pr) => pr.season === stats.season) ??
								last(allRatings);

							return {
								...pRest,
								pos: ratings.pos,
								skills: ratings.skills,
								stats,
							};
						});
					});
				} else {
					rows = await readRows((pRaw) => {
						const p = formatPlayer(pRaw);
						if (!p) {
							return [];
						}

						const {
							careerStats,
							careerStatsPlayoffs,
							careerStatsCombined,
							ratings,
							stats: allStats,
							...pRest
						} = p;
						const stats =
							inputs.playoffs === "playoffs"
								? careerStatsPlayoffs
								: inputs.playoffs === "combined"
									? careerStatsCombined
									: careerStats;
						if (!stats) {
							return [];
						}

						return [
							{
								...pRest,
								pos: getBestPos({ ratings, stats: allStats }, tid),
								skills: undefined,
								stats,
							},
						];
					});
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
});
