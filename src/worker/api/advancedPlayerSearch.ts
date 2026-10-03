import { PHASE, PLAYER } from "../../common/constants.ts";
import {
	allFilters,
	getExtraStatTypeKeys,
} from "../../common/advancedPlayerSearch.ts";
import type {
	Player,
	PlayerAttr,
	PlayerRatingAttr,
	PlayerStatAttr,
	PlayerStatType,
} from "../../common/types.ts";
import type { ViewInput } from "../util/defineView.ts";
import { last, maxBy } from "../../common/utils.ts";
import { normalizeIntl } from "../../common/normalizeIntl.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { buffOvrDH } from "../views/depth.ts";
import { iterateActivePlayersSeasonRange } from "../views/rosterContinuity.ts";
import type { SeasonType } from "./processInputs.ts";
import { actualPhase } from "../util/actualPhase.ts";

const getPlayers = async (
	// Ignored if seasonRange is set
	season: number,
	attrs: PlayerAttr[],
	ratings: PlayerRatingAttr[],
	stats: PlayerStatAttr[],
	tidInput: number | undefined,
	playersAll: Player[],
	playoffs: SeasonType = "regularSeason",
	statType: PlayerStatType = "perGame",
	seasonRange?: [number, number],
) => {
	let tid: number | undefined;
	if (tidInput !== undefined && tidInput <= 0) {
		// For draft prospets and free agents, use current status
		playersAll = playersAll.filter((p) => p.tid === tidInput);
	} else {
		// For other teams, use playersPlus
		tid = tidInput;
	}

	const options = {
		attrs: [
			"pid",
			"firstName",
			"lastName",
			"age",
			"ageAtDeath", // Only needed for "totals" but oh well
			"contract",
			"injury",
			"hof",
			"watch",
			"tid",
			"abbrev",
			"draft",
			"awards",
			...attrs,
		],
		ratings: ["ovr", "pot", "skills", "pos", ...ratings],
		stats: ["abbrev", "tid", "jerseyNumber", ...stats],
		tid,
		mergeStats: "totOnly",
		showNoStats: tid === undefined, // If this is true and tid is set, then a bunch of false positives come back
		showRookies: true,
		fuzz: true,
		statType,
		seasonType: playoffs,
	} as const;

	if (seasonRange) {
		// Sum up totals within seasonRange, and use peak ratings
		const players = await idb.getCopies.playersPlus(playersAll, {
			...options,
			seasonRange,
		});

		return players.map(
			({
				careerStats,
				careerStatsPlayoffs,
				careerStatsCombined,
				ratings,
				stats,
				...p
			}) => {
				const totals =
					playoffs === "playoffs"
						? careerStatsPlayoffs
						: playoffs === "combined"
							? careerStatsCombined
							: careerStats;
				if (!totals) {
					throw new Error("Should never happen");
				}

				// Copy some over from first/last stats entry
				const firstStats = stats[0];
				const lastStats = stats.at(-1);
				const useStatsSeasons = stats.length > 1 || firstStats?.abbrev !== "FA";

				return {
					...p,
					ratings: maxBy(ratings, (row) => row.ovr) ?? last(ratings),
					stats: {
						...totals,
						seasonStart: useStatsSeasons
							? firstStats?.season
							: ratings[0].season,
						seasonEnd: useStatsSeasons
							? lastStats?.season
							: last(ratings).season,
						abbrev: lastStats?.abbrev,
						tid: lastStats?.tid,
						jerseyNumber: lastStats?.jerseyNumber,
					},
				};
			},
		);
	}

	const players = await idb.getCopies.playersPlus(playersAll, {
		...options,
		season,
	});

	const isCurrentSeason = g.get("season") === season;

	return players.flatMap((p) => {
		// idb.getCopies.playersPlus `tid` option doesn't work well enough (factoring in showNoStats and showRookies), so let's do it manually
		// For the current season, use the current team (including FA), not the last stats team
		// For other seasons, use the stats team for filtering
		if (tid !== undefined) {
			const pTid = isCurrentSeason ? p.tid : p.stats?.tid;
			if (pTid !== tid) {
				return [];
			}
		}

		return [
			{
				...p,
				// stats can be undefined for a rookie with showRookies and without showNoStats
				stats: {
					...p.stats,
					...(isCurrentSeason ? { abbrev: p.abbrev, tid: p.tid } : undefined),
					seasonStart: undefined,
					seasonEnd: undefined,
				},
			},
		];
	});
};

const unique = <T>(array: T[]) => Array.from(new Set(array));

export const advancedPlayerSearch = async ({
	seasonStart,
	seasonEnd,
	singleSeason,
	playoffs,
	statType,
	filters,
	showStatTypes,
}: ViewInput<"advancedPlayerSearch">) => {
	// Keys come from the filter definitions in allFilters, which are all valid attrs/ratings/stats
	let extraAttrs: PlayerAttr[] = [];
	let extraRatings: PlayerRatingAttr[] = ["season", "pos", "ovr", "pot"];
	let extraStats: PlayerStatAttr[] = ["season"];
	for (const filter of filters) {
		if (filter.category === "ratings") {
			extraRatings.push(filter.key as PlayerRatingAttr);
		} else if (filter.category === "bio") {
			const filterInfo = allFilters[filter.category]!.options[filter.key];
			if (filterInfo && filterInfo.workerFieldOverride !== null) {
				const key = filterInfo.workerFieldOverride ?? filter.key;
				extraAttrs.push(key as PlayerAttr);
			}
		} else {
			// Must be stats
			extraStats.push(filter.key as PlayerStatAttr);
		}
	}

	const more = getExtraStatTypeKeys(showStatTypes, true);
	extraAttrs.push(...(more.attrs as PlayerAttr[]));
	extraRatings.push(...(more.ratings as PlayerRatingAttr[]));
	extraStats.push(...(more.stats as PlayerStatAttr[]));

	extraAttrs = unique(extraAttrs);
	extraRatings = unique(extraRatings);
	extraStats = unique(extraStats);

	let seasonRange: [number, number] | undefined;
	if (singleSeason === "totals" && seasonStart !== seasonEnd) {
		// Sum up totals within seasonRange
		seasonRange = [seasonStart, seasonEnd];
	}

	const matchedPlayers: AdvancedPlayerSearchPlayer[] = [];

	// Special case for tid
	const abbrevFilter = filters.find(
		(filter) => filter.category === "bio" && filter.key === "abbrev",
	);
	let tid: number | undefined;
	if (abbrevFilter) {
		// Remove from list of filters, since we are handling it here
		filters = filters.filter((filter) => filter !== abbrevFilter);

		const abbrev = abbrevFilter.value;

		if (abbrev === "$ALL$") {
			tid = undefined;
		} else if (abbrev === "$DP$") {
			tid = PLAYER.UNDRAFTED;
		} else if (abbrev === "$FA$") {
			tid = PLAYER.FREE_AGENT;
		} else {
			const teamInfos = g.get("teamInfoCache");
			const index = teamInfos.findIndex((t) => t.abbrev === abbrev);
			if (index >= 0) {
				tid = index;
			}
		}
	}

	let actualSeasonEnd = seasonEnd;
	let seasonRangeType: "unique" | "all";
	if (
		seasonStart === seasonEnd &&
		seasonEnd === g.get("season") &&
		(tid === undefined || tid === PLAYER.UNDRAFTED)
	) {
		// Show the upcoming draft class too
		actualSeasonEnd += actualPhase() > PHASE.DRAFT ? 2 : 1;

		// Set to "unique" so the draft prospects are the only ones appearing in the excess seasons. This works only because we confirm seasonStart === seasonEnd, in which case normally the unique/all setting doesn't matter
		seasonRangeType = "unique";
	} else {
		// If we're looking for a range of seasons only, then each player can only appear in our results once, so unique is waht we want.
		seasonRangeType = seasonRange ? "unique" : "all";
	}

	for await (const { players, season } of iterateActivePlayersSeasonRange(
		seasonStart,
		actualSeasonEnd,
		seasonRangeType,
	)) {
		const playersPlus = await getPlayers(
			// Math.min is for draft prospects in future seasons
			Math.min(season, seasonEnd),
			extraAttrs,
			extraRatings,
			extraStats,
			tid,
			players,
			playoffs,
			statType,
			seasonRange,
		);

		for (const p of playersPlus) {
			if (__SPORT === "baseball") {
				buffOvrDH(p);
			}

			const matchesAll = filters.every((filter) => {
				const filterInfo = allFilters[filter.category]!.options[filter.key];
				if (!filterInfo) {
					return true;
				}

				if (filterInfo.valueType === "numeric") {
					if (filter.value === null) {
						return true;
					}

					const pValue = filterInfo.getValue(p, singleSeason);
					if (filter.operator === ">") {
						return pValue !== undefined && pValue > filter.value;
					} else if (filter.operator === "<") {
						return pValue !== undefined && pValue < filter.value;
					} else if (filter.operator === ">=") {
						return pValue !== undefined && pValue >= filter.value;
					} else if (filter.operator === "<=") {
						return pValue !== undefined && pValue <= filter.value;
					} else if (filter.operator === "=") {
						return pValue === filter.value;
					} else if (filter.operator === "!=") {
						return pValue !== filter.value;
					} else {
						throw new Error("Should never happen");
					}
				} else if (filterInfo.valueType === "string") {
					const pValue = filterInfo.getValue(p, singleSeason);
					const searchText = normalizeIntl(filter.value as string);
					const pValueString = normalizeIntl(pValue);
					if (filter.operator === "is exactly") {
						return searchText === pValueString;
					} else if (filter.operator === "is not exactly") {
						return searchText !== pValueString;
					} else {
						const includes = pValueString.includes(searchText);
						return filter.operator === "contains" ? includes : !includes;
					}
				}
			});

			if (matchesAll) {
				matchedPlayers.push(p);
			}
		}
	}

	return addFirstNameShort(matchedPlayers);
};

export type AdvancedPlayerSearchPlayer = Awaited<
	ReturnType<typeof getPlayers>
>[number];
