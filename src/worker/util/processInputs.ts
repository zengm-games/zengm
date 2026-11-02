import { g } from "./index.ts";
import type { PlayerStatType } from "../../common/types.ts";
import { REMAINING_PLAYOFF_TEAMS_PHASES } from "../../common/constants.ts";
import { actualPhase } from "./actualPhase.ts";
import { dropdownKeys } from "../../common/dropdownKeys.ts";
import { bySport } from "../../common/sportFunctions.ts";

// Values of the team URL param that mean something other than a single team
export type TeamSpecial =
	| "all"
	| "playoffs"
	| "special"
	| "watch"
	| "your_teams";

/**
 * Parse the team URL param into a tid or one of the special values allowed by the view.
 *
 * The param can be like "ATL_0" (preferred, the tid is used even if the abbrev has changed), "0", or "ATL" (from old URLs).
 *
 * "playoffs" is only allowed in phases with remaining playoff teams.
 *
 * Invalid or missing values fall back to "all" if it's allowed, otherwise the user's team.
 */
export const validateTeam = <const Special extends TeamSpecial = never>(
	team: string | undefined,
	specials: readonly Special[] = [],
): number | Special => {
	const special = specials.find((special) => special === team);
	if (
		special !== undefined &&
		(special !== "playoffs" ||
			REMAINING_PLAYOFF_TEAMS_PHASES.has(actualPhase()))
	) {
		return special;
	}

	const teamInfoCache = g.get("teamInfoCache");

	if (team !== undefined) {
		const int = Number.parseInt(team.split("_").at(-1)!);
		if (!Number.isNaN(int) && teamInfoCache[int]) {
			return int;
		}

		const tid = teamInfoCache.findIndex((t) => t.abbrev === team);
		if (tid >= 0) {
			return tid;
		}
	}

	const all = specials.find((special) => special === "all");
	if (all !== undefined) {
		return all;
	}

	return g.get("userTid");
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

// Returns value if it's one of options, otherwise defaultValue
export const validateOption = <const T extends string>(
	value: string | undefined,
	options: readonly T[],
	defaultValue: T,
): T => {
	for (const option of options) {
		if (option === value) {
			return option;
		}
	}
	return defaultValue;
};

export type SeasonType = (typeof dropdownKeys.playoffsCombined)[number];

export const validateSeasonType = (
	seasonType: string | undefined,
	defaultType: SeasonType = "regularSeason",
): SeasonType => {
	return validateOption(seasonType, dropdownKeys.playoffsCombined, defaultType);
};

// Like validateSeasonType, but for pages that don't have a combined option
export const validatePlayoffs = (
	playoffs: string | undefined,
	defaultType: (typeof dropdownKeys.playoffs)[number] = "regularSeason",
) => {
	return validateOption(playoffs, dropdownKeys.playoffs, defaultType);
};

// For pages that show the same stats in every sport, so only basketball has a choice of per game/per 36/totals
export const validateStatType = (
	statType: string | undefined,
): PlayerStatType => {
	return validateOption(
		statType,
		dropdownKeys.statTypesStrict,
		bySport({ basketball: "perGame", default: "totals" }),
	);
};

export const validateSeasonOnly = (params: { season?: string }) => {
	return {
		season: validateSeason(params.season),
	};
};
