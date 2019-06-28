import { PHASE } from "../../common";
import { g, helpers, overrides } from "../util";

/**
 * Validate that a given abbreviation corresponds to a team.
 *
 * If the abbreviation is not valid, then g.userTid and its correspodning abbreviation will be returned.
 *
 * @memberOf util.helpers
 * @param  {string} abbrev Three-letter team abbreviation, like "ATL".
 * @return {Array} Array with two elements, the team ID and the validated abbreviation.
 */
export const validateAbbrev = (abbrev?: string): [number, string] => {
    let tid = g.teamAbbrevsCache.indexOf(abbrev);

    if (tid < 0 || abbrev === undefined) {
        tid = g.userTid;
        abbrev = g.teamAbbrevsCache[tid];
    }

    return [tid, abbrev];
};

/**
 * Validate the given season.
 *
 * Currently this doesn't really do anything except replace "undefined" with g.season.
 *
 * @memberOf util.helpers
 * @param {number|string|undefined} season The year of the season to validate. If undefined, then g.season is used.
 * @return {number} Validated season (same as input unless input is undefined, currently).
 */
export const validateSeason = (season?: number | string): number => {
    if (season === undefined) {
        return g.season;
    }

    season = parseInt(season, 10);

    if (Number.isNaN(season)) {
        return g.season;
    }

    return season;
};

const account = (params, ctxBBGM) => {
    return {
        goldMessage:
            ctxBBGM.goldResult !== undefined
                ? ctxBBGM.goldResult.message
                : undefined,
        goldSuccess:
            ctxBBGM.goldResult !== undefined
                ? ctxBBGM.goldResult.success
                : undefined,
    };
};

const awardsRecords = params => {
    return {
        awardType: params.awardType || "champion",
    };
};

const customizePlayer = params => {
    if (params.hasOwnProperty("pid")) {
        return {
            pid: parseInt(params.pid, 10),
        };
    }

    return {
        pid: null,
    };
};

const deleteLeague = params => {
    return {
        lid: parseInt(params.lid, 10),
    };
};

const depth = params => {
    // Fix broken links
    if (params.abbrev === "FA") {
        return {
            redirectUrl: helpers.leagueUrl(["free_agents"]),
        };
    }
    if (params.abbrev === "DP") {
        return {
            redirectUrl: helpers.leagueUrl(["draft_scouting"]),
        };
    }

    const inputs = {};
    [inputs.tid, inputs.abbrev] = validateAbbrev(params.abbrev);

    const positions = overrides.common.constants.POSITIONS;
    inputs.pos = positions.includes(params.pos) ? params.pos : "QB";

    return inputs;
};

const draft = () => {
    if (g.phase !== PHASE.DRAFT && g.phase !== PHASE.FANTASY_DRAFT) {
        return {
            redirectUrl: helpers.leagueUrl([
                g.phase === PHASE.AFTER_DRAFT
                    ? "draft_summary"
                    : "draft_scouting",
            ]),
        };
    }
};

const draftLottery = params => {
    const season = validateSeason(params.season);

    return {
        season,
    };
};

const draftSummary = params => {
    let season = validateSeason(params.season);

    // Draft hasn't happened yet this year
    if (g.phase < PHASE.DRAFT) {
        if (season === g.season) {
            // View last season by default
            season = g.season - 1;
        }
    }

    return {
        season,
    };
};

const draftTeamHistory = params => {
    const [tid, abbrev] = validateAbbrev(params.abbrev);

    return {
        tid,
        abbrev,
    };
};

const eventLog = params => {
    const [tid, abbrev] = validateAbbrev(params.abbrev);

    return {
        tid,
        abbrev,
        season: validateSeason(params.season),
    };
};

const fantasyDraft = () => {
    if (g.phase === PHASE.FANTASY_DRAFT) {
        return {
            redirectUrl: helpers.leagueUrl(["draft"]),
        };
    }
};

const freeAgents = () => {
    if (g.phase === PHASE.RESIGN_PLAYERS) {
        return {
            redirectUrl: helpers.leagueUrl(["negotiation"]),
        };
    }
};

const gameLog = params => {
    return {
        abbrev: validateAbbrev(params.abbrev)[1],
        gid: params.gid !== undefined ? parseInt(params.gid, 10) : -1,
        season: validateSeason(params.season),
    };
};

const history = params => {
    let season = validateSeason(params.season);

    // If playoffs aren't over, season awards haven't been set
    if (g.phase <= PHASE.PLAYOFFS) {
        // View last season by default
        if (season === g.season) {
            season -= 1;
        }
    }

    return {
        season,
    };
};

const leaders = params => {
    return {
        season:
            params.season === "career"
                ? undefined
                : validateSeason(params.season),
        playoffs:
            params.playoffs !== undefined ? params.playoffs : "regularSeason",
    };
};

const liveGame = (params, ctxBBGM) => {
    const obj = {
        fromAction: !!ctxBBGM.fromAction,
    };
    if (ctxBBGM.playByPlay !== undefined) {
        obj.gidPlayByPlay = ctxBBGM.gidPlayByPlay;
        obj.playByPlay = ctxBBGM.playByPlay;
    }
    return obj;
};

const message = params => {
    return {
        mid: params.mid ? parseInt(params.mid, 10) : undefined,
    };
};

const negotiation = params => {
    const pid = parseInt(params.pid, 10);

    return {
        pid: pid >= 0 ? pid : undefined, // undefined will load whatever the active one is
    };
};

const negotiationList = () => {
    if (g.phase !== PHASE.RESIGN_PLAYERS) {
        return {
            redirectUrl: helpers.leagueUrl(["negotiation", -1]),
        };
    }
};

const player = params => {
    return {
        pid: params.pid !== undefined ? parseInt(params.pid, 10) : undefined,
    };
};

const playerFeats = params => {
    let abbrev;
    if (g.teamAbbrevsCache.includes(params.abbrev)) {
        abbrev = params.abbrev;
    } else {
        abbrev = "all";
    }

    let season;
    if (params.season && params.season !== "all") {
        season = validateSeason(params.season);
    } else {
        season = "all";
    }

    return {
        abbrev,
        season,
        playoffs:
            params.playoffs !== undefined ? params.playoffs : "regularSeason",
    };
};

const playerRatings = params => {
    let abbrev;
    if (g.teamAbbrevsCache.includes(params.abbrev)) {
        abbrev = params.abbrev;
    } else if (params.abbrev && params.abbrev === "watch") {
        abbrev = "watch";
    } else {
        abbrev = "all";
    }

    return {
        abbrev,
        season: validateSeason(params.season),
    };
};

const playerStats = params => {
    let abbrev;
    if (g.teamAbbrevsCache.includes(params.abbrev)) {
        abbrev = params.abbrev;
    } else if (params.abbrev && params.abbrev === "watch") {
        abbrev = "watch";
    } else {
        abbrev = "all";
    }

    const defaultStatType =
        process.env.SPORT === "basketball" ? "perGame" : "passing";

    return {
        abbrev,
        season:
            params.season === "career"
                ? undefined
                : validateSeason(params.season),
        statType:
            params.statType !== undefined ? params.statType : defaultStatType,
        playoffs:
            params.playoffs !== undefined ? params.playoffs : "regularSeason",
    };
};

const resetPassword = params => {
    return {
        token: params.token,
    };
};

const roster = params => {
    // Fix broken links
    if (params.abbrev === "FA") {
        return {
            redirectUrl: helpers.leagueUrl(["free_agents"]),
        };
    }
    if (params.abbrev === "DP") {
        return {
            redirectUrl: helpers.leagueUrl(["draft_scouting"]),
        };
    }

    const inputs = {};
    [inputs.tid, inputs.abbrev] = validateAbbrev(params.abbrev);
    inputs.season = validateSeason(params.season);

    return inputs;
};

const schedule = params => {
    const inputs = {};
    [inputs.tid, inputs.abbrev] = validateAbbrev(params.abbrev);
    return inputs;
};

const teamFinances = params => {
    const inputs = {};
    inputs.show = params.show !== undefined ? params.show : "10";
    [inputs.tid, inputs.abbrev] = validateAbbrev(params.abbrev);
    return inputs;
};

const teamHistory = params => {
    const inputs = {};
    inputs.show = params.show !== undefined ? params.show : "10";
    [inputs.tid, inputs.abbrev] = validateAbbrev(params.abbrev);
    return inputs;
};

const teamRecords = params => {
    return {
        byType: params.byType || "team",
    };
};

const teamStats = params => {
    return {
        season: validateSeason(params.season),
        teamOpponent:
            params.teamOpponent !== undefined ? params.teamOpponent : "team",
        playoffs:
            params.playoffs !== undefined ? params.playoffs : "regularSeason",
    };
};

const transactions = params => {
    let abbrev;
    let tid;
    if (params.abbrev && params.abbrev !== "all") {
        [tid, abbrev] = validateAbbrev(params.abbrev);
    } else if (params.abbrev && params.abbrev === "all") {
        tid = -1;
        abbrev = "all";
    } else {
        tid = g.userTid;
        abbrev = g.teamAbbrevsCache[tid];
    }

    let season;
    if (params.season && params.season !== "all") {
        season = validateSeason(params.season);
    } else if (params.season && params.season === "all") {
        season = "all";
    } else {
        season = g.season;
    }

    return {
        tid,
        abbrev,
        season,
        eventType: params.eventType || "all",
    };
};

const upcomingFreeAgents = params => {
    let season = validateSeason(params.season);

    if (g.phase <= PHASE.RESIGN_PLAYERS) {
        if (season < g.season) {
            season = g.season;
        }
    } else if (season < g.season + 1) {
        season = g.season + 1;
    }

    return {
        season,
    };
};

const watchList = params => {
    return {
        statType: params.statType !== undefined ? params.statType : "perGame",
        playoffs:
            params.playoffs !== undefined ? params.playoffs : "regularSeason",
    };
};

const validateSeasonOnly = params => {
    return {
        season: validateSeason(params.season),
    };
};

export default {
    account,
    awardsRecords,
    customizePlayer,
    deleteLeague,
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
    liveGame,
    message,
    negotiation,
    negotiationList,
    player,
    playerFeats,
    playerRatingDists: validateSeasonOnly,
    playerRatings,
    playerShotLocations: validateSeasonOnly,
    playerStatDists: validateSeasonOnly,
    playerStats,
    playoffs: validateSeasonOnly,
    relatives: player,
    resetPassword,
    roster,
    schedule,
    standings: validateSeasonOnly,
    teamFinances,
    teamHistory,
    teamRecords,
    teamShotLocations: teamStats,
    teamStatDists: validateSeasonOnly,
    teamStats,
    transactions,
    upcomingFreeAgents,
    watchList,
};
