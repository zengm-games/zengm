import { PHASE } from "../../common";
import { g, helpers, overrides } from "../util";
import type { Params } from "bbgm-router";
import type { PlayerStatType } from "../../common/types";

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
	if (abbrev !== undefined) {
		{
			const int = parseInt(abbrev);
			if (!Number.isNaN(int) && int < g.get("teamInfoCache").length) {
				return [int, g.get("teamInfoCache")[int].abbrev];
			}
		}

		{
			const tid = g.get("teamInfoCache").findIndex(t => t.abbrev === abbrev);
			if (tid >= 0) {
				return [tid, abbrev];
			}
		}

		{
			const parts = abbrev.split("_");
			const int = parseInt(parts[parts.length - 1]);
			if (!Number.isNaN(int) && int < g.get("teamInfoCache").length) {
				return [int, g.get("teamInfoCache")[int].abbrev];
			}
		}
	}

	if (strict) {
		return [g.get("userTid"), "???"];
	}

	const tid = g.get("userTid");
	abbrev = g.get("teamInfoCache")[tid].abbrev;
	if (abbrev === undefined) {
		abbrev = "???";
	}

	return [tid, abbrev];
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
export const validateSeason = (season?: number | string): number => {
	if (season === undefined) {
		return g.get("season");
	}

	if (typeof season === "string") {
		season = parseInt(season, 10);
	}

	if (Number.isNaN(season)) {
		return g.get("season");
	}

	return season;
};

const account = (params: Params, ctxBBGM: any) => {
	return {
		goldMessage: ctxBBGM.goldResult ? ctxBBGM.goldResult.message : undefined,
		goldSuccess: ctxBBGM.goldResult ? !!ctxBBGM.goldResult.success : undefined,
	};
};

const awardsRecords = (params: Params) => {
	return {
		awardType: params.awardType || "champion",
	};
};

const customizePlayer = (params: Params) => {
	let pid: number | null = null;
	if (typeof params.pid === "string") {
		pid = parseInt(params.pid, 10);
		if (Number.isNaN(pid) || pid < 0) {
			pid = null;
		}
	}

	return {
		pid,
	};
};

const depth = (params: Params) => {
	// Fix broken links
	if (params.abbrev === "FA") {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			redirectUrl: helpers.leagueUrl(["free_agents"]),
		};
		return returnValue;
	}

	if (params.abbrev === "DP") {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			redirectUrl: helpers.leagueUrl(["draft_scouting"]),
		};
		return returnValue;
	}

	const [tid, abbrev] = validateAbbrev(params.abbrev);
	const positions = overrides.common.constants.POSITIONS;

	// https://github.com/microsoft/TypeScript/issues/21732
	// @ts-ignore
	const pos: string = positions.includes(params.pos) ? params.pos : "QB";

	return { abbrev, pos, tid };
};

const draft = () => {
	if (
		g.get("phase") !== PHASE.DRAFT &&
		g.get("phase") !== PHASE.FANTASY_DRAFT &&
		g.get("phase") !== PHASE.EXPANSION_DRAFT
	) {
		return {
			redirectUrl: helpers.leagueUrl([
				g.get("phase") === PHASE.AFTER_DRAFT
					? "draft_history"
					: "draft_scouting",
			]),
		};
	}

	if (
		g.get("phase") === PHASE.EXPANSION_DRAFT &&
		g.get("expansionDraft").phase === "protection"
	) {
		return {
			redirectUrl: helpers.leagueUrl(["protect_players"]),
		};
	}
};

const draftLottery = (params: Params) => {
	const season = validateSeason(params.season);
	return {
		season,
	};
};

const draftSummary = (params: Params) => {
	let season = validateSeason(params.season); // Draft hasn't happened yet this year

	if (g.get("phase") < PHASE.DRAFT) {
		if (season === g.get("season")) {
			// View last season by default
			season = g.get("season") - 1;
		}
	}

	return {
		season,
	};
};

const draftTeamHistory = (params: Params) => {
	const [tid, abbrev] = validateAbbrev(params.abbrev);
	return {
		tid,
		abbrev,
	};
};

const eventLog = (params: Params) => {
	const [tid, abbrev] = validateAbbrev(params.abbrev);
	return {
		tid,
		abbrev,
		season: validateSeason(params.season),
	};
};

const fantasyDraft = () => {
	if (g.get("phase") === PHASE.FANTASY_DRAFT) {
		return {
			redirectUrl: helpers.leagueUrl(["draft"]),
		};
	}
};

const freeAgents = () => {
	if (g.get("phase") === PHASE.RESIGN_PLAYERS) {
		return {
			redirectUrl: helpers.leagueUrl(["negotiation"]),
		};
	}
};

const gameLog = (params: Params) => {
	const abbrev =
		params.abbrev === "special" ? "special" : validateAbbrev(params.abbrev)[1];
	return {
		abbrev,
		gid: params.gid !== undefined ? parseInt(params.gid, 10) : -1,
		season: validateSeason(params.season),
	};
};

const history = (params: Params) => {
	let season = validateSeason(params.season);

	// If playoffs aren't over, season awards haven't been set
	if (g.get("phase") >= 0 && g.get("phase") <= PHASE.PLAYOFFS) {
		// View last season by default
		if (season === g.get("season")) {
			season -= 1;
		}
	}

	return {
		season,
	};
};

const leaders = (params: Params) => {
	const playoffs =
		params.playoffs === "playoffs" ? "playoffs" : "regularSeason";

	return {
		season: validateSeason(params.season),
		playoffs,
	};
};

const liveGame = (params: Params, ctxBBGM: any) => {
	const obj: {
		fromAction: boolean;
		gidPlayByPlay?: number;
		playByPlay?: any[];
	} = {
		fromAction: !!ctxBBGM.fromAction,
	};

	if (ctxBBGM.playByPlay !== undefined) {
		obj.gidPlayByPlay = ctxBBGM.gidPlayByPlay;
		obj.playByPlay = ctxBBGM.playByPlay;
	}

	return obj;
};

const message = (params: Params) => {
	return {
		mid: params.mid ? parseInt(params.mid, 10) : undefined,
	};
};

const most = (params: Params) => {
	return {
		type: params.type,
	};
};

const negotiation = (params: Params) => {
	// undefined will load whatever the active one is
	let pid: number | undefined;
	if (typeof params.pid === "string") {
		pid = parseInt(params.pid, 10);
		if (Number.isNaN(pid) || pid < 0) {
			pid = undefined;
		}
	}

	return {
		pid,
	};
};

const negotiationList = () => {
	if (g.get("phase") !== PHASE.RESIGN_PLAYERS) {
		return {
			redirectUrl: helpers.leagueUrl(["negotiation", -1]),
		};
	}
};

const newLeague = (params: Params) => {
	let type: "custom" | "random" | "real" | "legends" = "custom";
	let lid;
	if (params.x === "random") {
		type = "random";
	} else if (params.x === "real") {
		type = "real";
	} else if (params.x === "legends") {
		type = "legends";
	} else if (params.x !== undefined) {
		lid = parseInt(params.x, 10);
		if (Number.isNaN(lid)) {
			lid = undefined;
		}
		type = "custom";
	}

	return {
		lid,
		type,
	};
};

const player = (params: Params) => {
	return {
		pid: params.pid !== undefined ? parseInt(params.pid, 10) : undefined,
	};
};

const playerFeats = (params: Params) => {
	let abbrev;

	if (
		params.abbrev !== undefined &&
		g.get("teamInfoCache").some(t => t.abbrev === params.abbrev)
	) {
		abbrev = params.abbrev;
	} else {
		abbrev = "all";
	}

	let season: number | "all";

	if (params.season && params.season !== "all") {
		season = validateSeason(params.season);
	} else {
		season = "all";
	}

	return {
		abbrev,
		season,
	};
};

const playerRatings = (params: Params) => {
	let abbrev;
	let tid: number | undefined;

	const [validatedTid, validatedAbbrev] = validateAbbrev(params.abbrev, true);

	if (params.abbrev !== undefined && validatedAbbrev !== "???") {
		abbrev = validatedAbbrev;
		tid = validatedTid;
	} else if (params.abbrev && params.abbrev === "watch") {
		abbrev = "watch";
	} else {
		abbrev = "all";
	}

	return {
		abbrev,
		season: validateSeason(params.season),
		tid,
	};
};

const playerStats = (params: Params) => {
	let abbrev;

	if (
		params.abbrev !== undefined &&
		g.get("teamInfoCache").some(t => t.abbrev === params.abbrev)
	) {
		abbrev = params.abbrev;
	} else if (params.abbrev && params.abbrev === "watch") {
		abbrev = "watch";
	} else {
		abbrev = "all";
	}

	const playoffs =
		params.playoffs === "playoffs" ? "playoffs" : "regularSeason";

	const defaultStatType =
		process.env.SPORT === "basketball" ? "perGame" : "passing";
	return {
		abbrev,
		season:
			params.season === "career" ? undefined : validateSeason(params.season),
		statType: params.statType !== undefined ? params.statType : defaultStatType,
		playoffs,
	};
};

const resetPassword = (params: Params) => {
	return {
		token: params.token,
	};
};

const roster = (params: Params) => {
	// Fix broken links
	if (params.abbrev === "FA") {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			redirectUrl: helpers.leagueUrl(["free_agents"]),
		};
		return returnValue;
	}

	if (params.abbrev === "DP") {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			redirectUrl: helpers.leagueUrl(["draft_scouting"]),
		};
		return returnValue;
	}

	const [tid, abbrev] = validateAbbrev(params.abbrev);
	const season = validateSeason(params.season);
	return { abbrev, season, tid };
};

const schedule = (params: Params) => {
	const [tid, abbrev] = validateAbbrev(params.abbrev);
	return { abbrev, tid };
};

const teamFinances = (params: Params) => {
	const show = params.show !== undefined ? params.show : "10";
	const [tid, abbrev] = validateAbbrev(params.abbrev);
	return { abbrev, show, tid };
};

const teamHistory = (params: Params) => {
	const show = params.show !== undefined ? params.show : "10";
	const [tid, abbrev] = validateAbbrev(params.abbrev);
	return { abbrev, show, tid };
};

const teamRecords = (params: Params) => {
	return {
		byType: params.byType || "by_team",
	};
};

const teamStats = (params: Params) => {
	const playoffs =
		params.playoffs === "playoffs" ? "playoffs" : "regularSeason";

	return {
		season: validateSeason(params.season),
		teamOpponent:
			params.teamOpponent !== undefined ? params.teamOpponent : "team",
		playoffs,
	};
};

const leagueStats = (params: Params) => {
	let abbrev: string = "all";
	let tid: number = -1;
	if (params.abbrev && params.abbrev !== "all") {
		[tid, abbrev] = validateAbbrev(params.abbrev);
	}

	if (tid < 0) {
		tid = -1;
		abbrev = "all";
	}

	const playoffs =
		params.playoffs === "playoffs" ? "playoffs" : "regularSeason";

	return {
		tid,
		abbrev,
		teamOpponent:
			params.teamOpponent !== undefined ? params.teamOpponent : "team",
		playoffs,
	};
};

const transactions = (params: Params) => {
	let abbrev: string;
	let tid: number;
	if (params.abbrev && params.abbrev !== "all") {
		[tid, abbrev] = validateAbbrev(params.abbrev);
	} else if (params.abbrev && params.abbrev === "all") {
		tid = -1;
		abbrev = "all";
	} else {
		tid = g.get("userTid");
		abbrev = g.get("teamInfoCache")[tid].abbrev;
	}

	let season: number | "all";

	if (params.season && params.season !== "all") {
		season = validateSeason(params.season);
	} else if (params.season && params.season === "all") {
		season = "all";
	} else {
		season = g.get("season");
	}

	return {
		tid,
		abbrev,
		season,
		eventType: params.eventType || "all",
	};
};

const upcomingFreeAgents = (params: Params) => {
	let season = validateSeason(params.season);

	if (g.get("phase") >= 0 && g.get("phase") <= PHASE.RESIGN_PLAYERS) {
		if (season < g.get("season")) {
			season = g.get("season");
		}
	} else if (season < g.get("season") + 1) {
		season = g.get("season") + 1;
	}

	return {
		season,
	};
};

const watchList = (params: Params) => {
	let statType: PlayerStatType;
	if (params.statType === "per36") {
		statType = params.statType;
	} else if (params.statType === "totals") {
		statType = params.statType;
	} else {
		statType = "perGame";
	}

	const playoffs =
		params.playoffs === "playoffs" ? "playoffs" : "regularSeason";

	return { playoffs, statType };
};

const validateSeasonOnly = (params: Params) => {
	return {
		season: validateSeason(params.season),
	};
};

export default {
	account,
	awardRaces: validateSeasonOnly,
	awardsRecords,
	customizePlayer,
	depth,
	draft,
	draftLottery,
	draftSummary,
	draftTeamHistory,
	eventLog,
	fantasyDraft,
	freeAgents,
	gameLog,
	history,
	leaders,
	leagueFinances: validateSeasonOnly,
	leagueStats,
	liveGame,
	message,
	most,
	negotiation,
	negotiationList,
	newLeague,
	player,
	playerBios: playerRatings,
	playerFeats,
	playerRatingDists: validateSeasonOnly,
	playerRatings,
	playerStatDists: validateSeasonOnly,
	playerStats,
	playoffs: validateSeasonOnly,
	powerRankings: validateSeasonOnly,
	relatives: player,
	resetPassword,
	roster,
	schedule,
	standings: validateSeasonOnly,
	teamFinances,
	teamHistory,
	teamRecords,
	teamStatDists: validateSeasonOnly,
	teamStats,
	transactions,
	upcomingFreeAgents,
	watchList,
};
