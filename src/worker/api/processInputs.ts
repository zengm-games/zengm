import { bySport, PHASE, POSITIONS } from "../../common";
import { g, helpers } from "../util";
import type { PlayerStatType } from "../../common/types";
import type { Params } from "../../ui/router";

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
				return [int, g.get("teamInfoCache")[int]?.abbrev];
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
			const int = parseInt(parts.at(-1));
			if (!Number.isNaN(int) && int < g.get("teamInfoCache").length) {
				return [int, g.get("teamInfoCache")[int]?.abbrev];
			}
		}
	}

	if (strict) {
		return [g.get("userTid"), "???"];
	}

	const tid = g.get("userTid");
	abbrev = g.get("teamInfoCache")[tid]?.abbrev;
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
		season = parseInt(season);
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
		pid = parseInt(params.pid);
		if (Number.isNaN(pid) || pid < 0) {
			pid = null;
		}
	}

	let type: "clone" | undefined;
	if (params.type === "clone" && pid !== null) {
		type = "clone";
	}

	return {
		pid,
		type,
	};
};

const depth = (params: Params) => {
	// Fix broken links
	if (params.abbrev === "FA" || params.abbrev === "FA_-1") {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			redirectUrl: helpers.leagueUrl(["free_agents"]),
		};
		return returnValue;
	}

	if (params.abbrev === "DP" || params.abbrev === "DP_-2") {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			redirectUrl: helpers.leagueUrl(["draft_scouting"]),
		};
		return returnValue;
	}

	const [tid, abbrev] = validateAbbrev(params.abbrev);

	const DEFAULT_POS = bySport({
		basketball: "G",
		football: "QB",
		hockey: "F",
	});

	// https://github.com/microsoft/TypeScript/issues/21732
	// @ts-expect-error
	const pos: string = POSITIONS.includes(params.pos) ? params.pos : DEFAULT_POS;

	const playoffs =
		params.playoffs === "playoffs" ? "playoffs" : "regularSeason";

	return { abbrev, playoffs, pos, tid };
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

const draftHistory = (params: Params) => {
	let season: number;

	const draftAlreadyHappened = g.get("phase") >= PHASE.DRAFT;
	const currentSeason = g.get("season");

	if (
		(params.season === undefined || params.season === String(currentSeason)) &&
		!draftAlreadyHappened
	) {
		// View last season by default
		season = currentSeason - 1;
	} else {
		season = validateSeason(params.season);
	}

	if (
		season > currentSeason ||
		(season === currentSeason && !draftAlreadyHappened)
	) {
		// Future draft class
		return {
			redirectUrl: helpers.leagueUrl(["draft_scouting"]),
		};
	}

	return {
		season,
	};
};

const draftTeamHistory = (params: Params) => {
	let [tid, abbrev] = validateAbbrev(params.abbrev);

	if (params.abbrev === "your_teams") {
		tid = -1;
		abbrev = "your_teams";
	}

	return {
		tid,
		abbrev,
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

const frivolitiesTrades = (params: Params) => {
	let abbrev: string = "all";
	let tid: number = -1;
	if (params.abbrev && params.abbrev !== "all") {
		[tid, abbrev] = validateAbbrev(params.abbrev);
	}

	if (tid < 0) {
		tid = -1;
		abbrev = "all";
	}

	return {
		abbrev,
		tid,
		type: params.type,
	};
};

const gameLog = (params: Params) => {
	const abbrev =
		params.abbrev === "special" ? "special" : validateAbbrev(params.abbrev)[1];
	return {
		abbrev,
		gid: params.gid !== undefined ? parseInt(params.gid) : -1,
		season: validateSeason(params.season),
	};
};

const headToHeadAll = (params: Params) => {
	let season: number | "all";

	if (params.season && params.season !== "all") {
		season = validateSeason(params.season);
	} else {
		season = "all";
	}

	let type: "playoffs" | "regularSeason" | "all";
	if (params.type === "playoffs") {
		type = "playoffs";
	} else if (params.type === "regularSeason") {
		type = "regularSeason";
	} else {
		type = "all";
	}

	return {
		season,
		type,
	};
};

const headToHead = (params: Params) => {
	const [tid, abbrev] = validateAbbrev(params.abbrev);

	return {
		abbrev,
		tid,
		...headToHeadAll(params),
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

const injuries = (params: Params) => {
	let season: number | "current";

	if (params.season && params.season !== "current") {
		season = validateSeason(params.season);
	} else {
		season = "current";
	}

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
		season,
		tid,
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

const dailySchedule = (params: Params) => {
	if (params.season === "today") {
		return {
			day: undefined,
			season: g.get("season"),
			today: true,
		};
	}

	const season = validateSeason(params.season);

	let day = params.day === undefined ? undefined : parseInt(params.day as any);
	if (Number.isNaN(day)) {
		day = 1;
	}

	return {
		day,
		season,
	};
};

const liveGame = (params: Params, ctxBBGM: any) => {
	const obj: {
		fromAction: boolean;
		gid?: number;
		playByPlay?: any[];
	} = {
		fromAction: !!ctxBBGM.fromAction,
	};

	if (ctxBBGM.playByPlay !== undefined) {
		obj.gid = ctxBBGM.gidOneGame;
		obj.playByPlay = ctxBBGM.playByPlay;
	}

	return obj;
};

const message = (params: Params) => {
	return {
		mid: params.mid ? parseInt(params.mid) : undefined,
	};
};

const most = (params: Params) => {
	return {
		arg: params.arg,
		type: params.type,
	};
};

const negotiation = (params: Params) => {
	// undefined will load whatever the active one is
	let pid: number | undefined;
	if (typeof params.pid === "string") {
		pid = parseInt(params.pid);
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
		lid = parseInt(params.x);
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

const news = (params: Params) => {
	const season = validateSeason(params.season);
	let level: "all" | "normal" | "big";
	if (params.level === "all") {
		level = "all";
	} else if (params.level === "normal") {
		level = "normal";
	} else {
		level = "big";
	}

	const order: "oldest" | "newest" =
		params.order === "oldest" ? "oldest" : "newest";

	let abbrev;
	let tid: number | undefined;
	const [validatedTid, validatedAbbrev] = validateAbbrev(params.abbrev, true);
	if (
		params.abbrev !== undefined &&
		params.abbrev !== "all" &&
		validatedAbbrev !== "???"
	) {
		abbrev = validatedAbbrev;
		tid = validatedTid;
	} else {
		abbrev = "all";
	}

	return {
		abbrev,
		level,
		order,
		season,
		tid,
	};
};

const player = (params: Params) => {
	return {
		pid: params.pid !== undefined ? parseInt(params.pid) : undefined,
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

const playerGameLog = (params: Params) => {
	return {
		pid: params.pid !== undefined ? parseInt(params.pid) : undefined,
		season: validateSeason(params.season),
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

	const [, validatedAbbrev] = validateAbbrev(params.abbrev, true);

	if (params.abbrev !== undefined && validatedAbbrev !== "???") {
		abbrev = validatedAbbrev;
	} else if (params.abbrev && params.abbrev === "watch") {
		abbrev = "watch";
	} else {
		abbrev = "all";
	}

	const playoffs =
		params.playoffs === "playoffs" ? "playoffs" : "regularSeason";

	const defaultStatType = bySport({
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

	return {
		abbrev,
		season,
		statType: params.statType ?? defaultStatType,
		playoffs,
	};
};

const playerStatDists = (params: Params) => {
	const defaultStatType = bySport({
		basketball: "perGame",
		football: "passing",
		hockey: "skater",
	});
	return {
		season: validateSeason(params.season),
		statType: params.statType != undefined ? params.statType : defaultStatType,
	};
};

const resetPassword = (params: Params) => {
	return {
		token: params.token,
	};
};

const roster = (params: Params) => {
	// Fix broken links
	if (params.abbrev === "FA" || params.abbrev === "FA_-1") {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			redirectUrl: helpers.leagueUrl(["free_agents"]),
		};
		return returnValue;
	}

	if (params.abbrev === "DP" || params.abbrev === "DP_-2") {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			redirectUrl: helpers.leagueUrl(["draft_scouting"]),
		};
		return returnValue;
	}

	const [tid, abbrev] = validateAbbrev(params.abbrev);
	const season = validateSeason(params.season);

	const playoffs =
		params.playoffs === "playoffs" ? "playoffs" : "regularSeason";

	return { abbrev, playoffs, season, tid };
};

const schedule = (params: Params) => {
	const [tid, abbrev] = validateAbbrev(params.abbrev);
	return { abbrev, tid };
};

const teamFinances = (params: Params) => {
	const show = params.show ?? "10";
	const [tid, abbrev] = validateAbbrev(params.abbrev);
	return { abbrev, show, tid };
};

const teamHistory = (params: Params) => {
	const show = params.show ?? "10";
	const [tid, abbrev] = validateAbbrev(params.abbrev);
	return { abbrev, show, tid };
};

const teamRecords = (params: Params) => {
	const filter: "all" | "your_teams" =
		params.filter === "your_teams" ? "your_teams" : "all";
	return {
		byType: params.byType || "by_team",
		filter,
	};
};

const teamStats = (params: Params) => {
	const playoffs =
		params.playoffs === "playoffs" ? "playoffs" : "regularSeason";

	return {
		season: validateSeason(params.season),
		teamOpponent: params.teamOpponent ?? "team",
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
		teamOpponent: params.teamOpponent ?? "team",
		playoffs,
	};
};

const standings = (params: Params) => {
	let type: "conf" | "div" | "league" =
		g.get("numGamesPlayoffSeries").length === 0
			? "league"
			: bySport({
					basketball: "conf",
					football: "div",
					hockey: "div",
			  });
	if (
		params.type === "conf" ||
		params.type === "div" ||
		params.type === "league"
	) {
		type = params.type;
	}

	return {
		season: validateSeason(params.season),
		type,
	};
};

const tradeSummary = (params: Params) => {
	return {
		eid: params.eid ? parseInt(params.eid) : NaN,
	};
};

const tradingBlock = (params: Params, ctxBBGM: any) => {
	const pid = ctxBBGM.pid;
	return {
		pid: typeof pid === "number" ? pid : undefined,
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
		abbrev = g.get("teamInfoCache")[tid]?.abbrev;
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

	const actualPhase = g.get("nextPhase") ?? g.get("phase");
	if (actualPhase >= 0 && actualPhase <= PHASE.RESIGN_PLAYERS) {
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

	let flagNote: "flag" | "note" | "either";
	if (params.flagNote === "either") {
		flagNote = "either";
	} else if (params.flagNote === "note") {
		flagNote = "note";
	} else {
		flagNote = "flag";
	}

	const playoffs =
		params.playoffs === "playoffs" ? "playoffs" : "regularSeason";

	return { playoffs, statType, flagNote };
};

const powerRankings = (params: Params) => {
	let playoffs =
		g.get("phase") === PHASE.PLAYOFFS ? "playoffs" : "regularSeason";
	if (params.playoffs === "playoffs") {
		playoffs = "playoffs";
	} else if (params.playoffs === "regularSeason") {
		playoffs = "regularSeason";
	}

	return {
		playoffs,
		season: validateSeason(params.season),
	};
};

const validateSeasonOnly = (params: Params) => {
	return {
		season: validateSeason(params.season),
	};
};

export default {
	account,
	allStarDraft: validateSeasonOnly,
	allStarDunk: validateSeasonOnly,
	allStarThree: validateSeasonOnly,
	awardRaces: validateSeasonOnly,
	awardsRecords,
	customizePlayer,
	dailySchedule,
	depth,
	draft,
	draftLottery,
	draftHistory,
	draftTeamHistory,
	editAwards: validateSeasonOnly,
	exportPlayers: validateSeasonOnly,
	fantasyDraft,
	freeAgents,
	frivolitiesTeamSeasons: most,
	frivolitiesTrades,
	gameLog,
	headToHead,
	headToHeadAll,
	history,
	injuries,
	leaders,
	leagueFinances: validateSeasonOnly,
	leagueStats,
	liveGame,
	message,
	most,
	negotiation,
	negotiationList,
	newLeague,
	news,
	player,
	playerBios: playerRatings,
	playerFeats,
	playerGameLog,
	playerRatingDists: validateSeasonOnly,
	playerRatings,
	playerStatDists,
	playerStats,
	playoffs: validateSeasonOnly,
	powerRankings,
	relatives: player,
	resetPassword,
	roster,
	schedule,
	seasonPreview: validateSeasonOnly,
	standings,
	teamFinances,
	teamHistory,
	teamRecords,
	teamStatDists: validateSeasonOnly,
	teamStats,
	tradeSummary,
	tradingBlock,
	transactions,
	upcomingFreeAgents,
	watchList,
};
