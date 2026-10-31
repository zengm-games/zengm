import { g } from "./index.ts";
import type { PlayerStatType } from "../../common/types.ts";
import { bySport } from "../../common/sportFunctions.ts";

/**
 * Validate that a given abbreviation corresponds to a team.
 *
 * If the abbreviation is not valid, then g.get("userTid") and its correspodning abbreviation will be returned.
 *
 * @memberOf util.helpers
 * @param  {string} abbrev Three-letter team abbreviation, like "ATL". Can also be a numeric team ID like "0" or a concatenated one like "ATL_0", in which case the number will be used.
 * @return {Array} Array with two elements, the team ID and the validated abbreviation.
 */
export const validateAbbrev = (
	abbrev?: string,
	strict?: boolean,
): [number, string] => {
	const teamInfoCache = g.get("teamInfoCache");

	if (abbrev !== undefined) {
		{
			const tid = teamInfoCache.findIndex((t) => t.abbrev === abbrev);
			if (tid >= 0) {
				return [tid, abbrev];
			}
		}

		{
			const parts = abbrev.split("_");
			const int = Number.parseInt(parts.at(-1)!);
			if (!Number.isNaN(int) && teamInfoCache[int]) {
				return [int, teamInfoCache[int].abbrev];
			}
		}
	}

	if (strict) {
		return [g.get("userTid"), "???"];
	}

	const tid = g.get("userTid");
	return [tid, teamInfoCache[tid]?.abbrev ?? "???"];
};

/**
 * Validate the given season.
 *
 * Currently this doesn't really do anything except replace "undefined" with g.get("season").
 *
 * @memberOf util.helpers
 * @param {number|string|undefined} season The year of the season to validate. If undefined, then g.get("season") is used.
 * @return {number} Validated season (same as input unless input is undefined, currently).
 */
export const validateSeason = (season: number | string | undefined): number => {
	if (season === undefined) {
		return g.get("season");
	}

	if (typeof season === "string") {
		season = Number.parseInt(season);
	}

	if (Number.isNaN(season)) {
		return g.get("season");
	}

	return season;
};

export type SeasonType = "playoffs" | "regularSeason" | "combined";

export const validateSeasonType = (
	seasonType: string | undefined,
	defaultType: SeasonType = "regularSeason",
): SeasonType => {
	if (seasonType === "playoffs") {
		return "playoffs";
	} else if (seasonType === "regularSeason") {
		return "regularSeason";
	} else if (seasonType === "combined") {
		return "combined";
	} else {
		return defaultType;
	}
};

export const validateStatType = (
	statType: string | undefined,
): PlayerStatType => {
	if (statType === "perGame") {
		return "perGame";
	} else if (statType === "per36") {
		return "per36";
	} else if (statType === "totals") {
		return "totals";
	} else {
		return bySport({
			baseball: "totals",
			basketball: "perGame",
			football: "totals",
			hockey: "totals",
		});
	}
};

export const validateSeasonOnly = (params: { season?: string }) => {
	return {
		season: validateSeason(params.season),
	};
};
