import { g } from "./index.ts";
import type { PlayerStatType } from "../../common/types.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { REMAINING_PLAYOFF_TEAMS_PHASES } from "../../common/constants.ts";
import { actualPhase } from "./actualPhase.ts";

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
