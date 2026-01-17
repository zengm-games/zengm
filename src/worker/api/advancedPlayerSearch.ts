import { isSport, PHASE, PLAYER } from "../../common/index.ts";
import {
	allFilters,
	getExtraStatTypeKeys,
} from "../../common/advancedPlayerSearch.ts";
import type { Player, PlayerStatType, ViewInput } from "../../common/types.ts";
import { maxBy } from "../../common/utils.ts";
import { normalizeIntl } from "../../common/normalizeIntl.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { buffOvrDH } from "../views/depth.ts";
import { iterateActivePlayersSeasonRange } from "../views/rosterContinuity.ts";
import type { SeasonType } from "./processInputs.ts";
import { actualPhase } from "../util/actualPhase.ts";

const getPlayers = async (
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
		playersAll = playersAll.filter((p) => p.tid === tidInput);
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
			players = players.filter((p) => p.tid === tid);
		}

		for (const p of players) {
			p.stats.abbrev = p.abbrev;
			p.stats.tid = p.tid;
		}
	} else if (tid !== undefined && seasonRange === undefined) {
		players = players.filter((p) => p.stats.tid === tid);
	}

	if (isSport("baseball")) {
		for (const p of players) {
			buffOvrDH(p);
		}
	}

	return players;
};

const unique = (array: string[]) => Array.from(new Set(array));

export const advancedPlayerSearch = async ({
	seasonStart,
	seasonEnd,
	singleSeason,
	playoffs,
	statType,
	filters,
	showStatTypes,
}: ViewInput<"advancedPlayerSearch">) => {
	let extraAttrs: string[] = [];
	let extraRatings: string[] = ["season", "pos", "ovr", "pot"];
	let extraStats: string[] = ["season"];
	for (const filter of filters) {
		if (filter.category === "ratings") {
			extraRatings.push(filter.key);
		} else if (filter.category === "bio") {
			const filterInfo = allFilters[filter.category]!.options[filter.key];
			if (filterInfo && filterInfo.workerFieldOverride !== null) {
				const key = filterInfo.workerFieldOverride ?? filter.key;
				extraAttrs.push(key);
			}
		} else {
			// Must be stats
			extraStats.push(filter.key);
		}
	}

	const more = getExtraStatTypeKeys(showStatTypes, true);
	extraAttrs.push(...more.attrs);
	extraRatings.push(...more.ratings);
	extraStats.push(...more.stats);

	extraAttrs = unique(extraAttrs);
	extraRatings = unique(extraRatings);
	extraStats = unique(extraStats);

	let seasonRange: [number, number] | undefined;
	if (singleSeason === "totals" && seasonStart !== seasonEnd) {
		// Sum up totals within seasonRange
		seasonRange = [seasonStart, seasonEnd];
	}

	const matchedPlayers = [];

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
			seasonRange ? undefined : Math.min(season, seasonEnd),
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
				if (p.stats.length > 1 || p.stats[0]?.abbrev !== "FA") {
					p[obj].seasonStart = p.stats[0]?.season;
					p[obj].seasonEnd = p.stats.at(-1)?.season;
				} else {
					p[obj].seasonStart = p.ratings[0]?.season;
					p[obj].seasonEnd = p.ratings.at(-1)?.season;
				}
				p[obj].abbrev = p.stats.at(-1)?.abbrev;
				p[obj].tid = p.stats.at(-1)?.tid;
				p[obj].jerseyNumber = p.stats.at(-1)?.jerseyNumber;
				p.ratings = maxBy(p.ratings, (row) => row.ovr);
			} else {
				obj = "stats";
			}
			p.stats = p[obj];

			const matchesAll = filters.every((filter) => {
				const filterInfo = allFilters[filter.category]!.options[filter.key];
				if (!filterInfo) {
					return true;
				}

				const pValue = filterInfo.getValue(p, singleSeason);
				if (filterInfo.valueType === "numeric") {
					if (filter.value === null) {
						return true;
					}

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

	return addFirstNameShort(matchedPlayers);
};
