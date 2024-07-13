import { PLAYER } from "../../common";
import { allFilters } from "../../common/advancedPlayerSearch";
import type { ViewInput } from "../../common/types";
import { maxBy } from "../../common/utils";
import { normalizeIntl } from "../../ui/components/DataTable/normalizeIntl";
import { g } from "../util";
import addFirstNameShort from "../util/addFirstNameShort";
import { getPlayers } from "../views/playerRatings";
import { iterateActivePlayersSeasonRange } from "../views/rosterContinuity";

export const advancedPlayerSearch = async ({
	seasonStart,
	seasonEnd,
	singleSeason,
	playoffs,
	statType,
	filters,
}: ViewInput<"advancedPlayerSearch">) => {
	const extraAttrs: string[] = [];
	const extraRatings: string[] = ["season", "pos", "ovr", "pot"];
	const extraStats: string[] = ["season"];
	for (const filter of filters) {
		if (filter.category === "ratings") {
			if (!extraRatings.includes(filter.key)) {
				extraRatings.push(filter.key);
			}
		} else if (filter.category === "bio") {
			const filterInfo = allFilters[filter.category].options[filter.key];
			if (filterInfo && filterInfo.workerFieldOverride !== null) {
				const key = filterInfo.workerFieldOverride ?? filter.key;
				if (!extraAttrs.includes(key)) {
					extraAttrs.push(key);
				}
			}
		} else {
			// Must be stats
			if (!extraStats.includes(filter.key)) {
				extraStats.push(filter.key);
			}
		}
	}

	let seasonRange: [number, number] | undefined;
	if (singleSeason === "totals" && seasonStart !== seasonEnd) {
		// Sum up totals within seasonRange
		seasonRange = [seasonStart, seasonEnd];
	}

	const matchedPlayers = [];

	// Special case for tid
	const abbrevFilter = filters.find(
		filter => filter.category === "bio" && filter.key === "abbrev",
	);
	let tid: number | undefined;
	if (abbrevFilter) {
		// Remove from list of filters, since we are handling it here
		filters = filters.filter(filter => filter !== abbrevFilter);

		const abbrev = abbrevFilter.value;

		if (abbrev === "$ALL$") {
			tid = undefined;
		} else if (abbrev === "$DP$") {
			tid = PLAYER.UNDRAFTED;
		} else if (abbrev === "$FA$") {
			tid = PLAYER.UNDRAFTED;
		} else {
			const teamInfos = g.get("teamInfoCache");
			const index = teamInfos.findIndex(t => t.abbrev === abbrev);
			if (index >= 0) {
				tid = index;
			}
		}
	}

	for await (const { players, season } of iterateActivePlayersSeasonRange(
		seasonStart,
		seasonEnd,
		seasonRange ? "unique" : "all",
	)) {
		const playersPlus = await getPlayers(
			seasonRange ? undefined : season,
			"all",
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
			// Fix stats vs careerStats
			let obj:
				| "careerStatsPlayoffs"
				| "careerStatsCombined"
				| "careerStats"
				| "stats";
			if (seasonRange) {
				if (playoffs === "playoffs") {
					obj = "careerStatsPlayoffs";
				} else if (playoffs === "combined") {
					obj = "careerStatsCombined";
				} else {
					obj = "careerStats";
				}

				// Copy some over from first/last stats entry
				p[obj].seasonStart = p.stats[0]?.season;
				p[obj].seasonEnd = p.stats.at(-1)?.season;
				p[obj].abbrev = p.stats.at(-1)?.abbrev;
				p[obj].tid = p.stats.at(-1)?.tid;
				p[obj].jerseyNumber = p.stats.at(-1)?.jerseyNumber;
				p.ratings = maxBy(p.ratings, row => row.ovr);
			} else {
				obj = "stats";
			}
			p.stats = p[obj];

			const matchesAll = filters.every(filter => {
				const filterInfo = allFilters[filter.category].options[filter.key];
				if (!filterInfo) {
					return true;
				}

				const pValue = filterInfo.getValue(p);
				if (filterInfo.valueType === "numeric") {
					const pValueNumber = pValue as number;
					if (filter.operator === ">") {
						return pValueNumber > filter.value;
					} else if (filter.operator === "<") {
						return pValueNumber < filter.value;
					} else if (filter.operator === ">=") {
						return pValueNumber >= filter.value;
					} else if (filter.operator === "<=") {
						return pValueNumber <= filter.value;
					} else if (filter.operator === "=") {
						return pValueNumber === filter.value;
					} else if (filter.operator === "!=") {
						return pValueNumber != filter.value;
					} else {
						throw new Error("Should never happen");
					}
				} else if (filterInfo.valueType === "string") {
					const searchText = normalizeIntl(filter.value as string);
					const pValueString = normalizeIntl(pValue as string);
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

	console.log(matchedPlayers);

	return addFirstNameShort(matchedPlayers);
};
