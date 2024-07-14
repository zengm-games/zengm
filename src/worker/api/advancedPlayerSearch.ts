import { isSport, PLAYER } from "../../common";
import { allFilters } from "../../common/advancedPlayerSearch";
import type { Player, PlayerStatType, ViewInput } from "../../common/types";
import { maxBy } from "../../common/utils";
import { normalizeIntl } from "../../ui/components/DataTable/normalizeIntl";
import { idb } from "../db";
import { g } from "../util";
import addFirstNameShort from "../util/addFirstNameShort";
import { buffOvrDH } from "../views/depth";
import { iterateActivePlayersSeasonRange } from "../views/rosterContinuity";
import type { SeasonType } from "./processInputs";

export const getPlayers = async (
	season: number | undefined,
	attrs: string[],
	ratings: string[],
	stats: string[],
	tidInput: number | undefined,
	playersAll: Player[],
	playoffs: SeasonType = "regularSeason",
	statType: PlayerStatType = "perGame",
	seasonRange?: [number, number],
) => {
	let tid: number | undefined;
	if (tidInput !== undefined && tidInput <= 0) {
		// For draft prospets and free agents, use current status
		playersAll = playersAll.filter(p => p.tid === tidInput);
	} else {
		// For other teams, use playersPlus
		tid = tidInput;
	}

	let players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"firstName",
			"lastName",
			"age",
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
		season,
		tid,
		mergeStats: "totOnly",
		showNoStats: tid === undefined, // If this is true and tid is set, then a bunch of false positives come back
		showRookies: true,
		fuzz: true,
		statType,
		playoffs: playoffs === "playoffs",
		regularSeason: playoffs === "regularSeason",
		combined: playoffs === "combined",
		seasonRange,
	});

	// idb.getCopies.playersPlus `tid` option doesn't work well enough (factoring in showNoStats and showRookies), so let's do it manually
	// For the current season, use the current abbrev (including FA), not the last stats abbrev
	// For other seasons, use the stats abbrev for filtering
	if (g.get("season") === season) {
		if (tid !== undefined) {
			players = players.filter(p => p.tid === tid);
		}

		for (const p of players) {
			p.stats.abbrev = p.abbrev;
			p.stats.tid = p.tid;
		}
	} else if (tid !== undefined) {
		players = players.filter(p => p.stats.tid === tid);
	}
	console.log(season, tid, players);

	if (isSport("baseball")) {
		for (const p of players) {
			buffOvrDH(p);
		}
	}

	return players;
};

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
			tid = PLAYER.FREE_AGENT;
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
