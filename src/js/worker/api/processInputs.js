import { PHASE, g, helpers } from "../../common";

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

const draft = () => {
    if (g.phase !== PHASE.DRAFT && g.phase !== PHASE.FANTASY_DRAFT) {
        return {
            redirectUrl: helpers.leagueUrl(["draft_summary"]),
        };
    }
};

const draftLottery = params => {
    const season = helpers.validateSeason(params.season);

    return {
        season,
    };
};

const draftSummary = params => {
    let season = helpers.validateSeason(params.season);

    // Draft hasn't happened yet this year
    if (g.phase < PHASE.DRAFT) {
        if (g.season === g.startingSeason) {
            // No draft history
            return {
                redirectUrl: helpers.leagueUrl(["draft_scouting"]),
            };
        }
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
    const [tid, abbrev] = helpers.validateAbbrev(params.abbrev);

    return {
        tid,
        abbrev,
    };
};

const eventLog = params => {
    const [tid, abbrev] = helpers.validateAbbrev(params.abbrev);

    return {
        tid,
        abbrev,
        season: helpers.validateSeason(params.season),
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
        abbrev: helpers.validateAbbrev(params.abbrev)[1],
        gid: params.gid !== undefined ? parseInt(params.gid, 10) : -1,
        season: helpers.validateSeason(params.season),
    };
};

const history = params => {
    let season = helpers.validateSeason(params.season);

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
        season = helpers.validateSeason(params.season);
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
        season: helpers.validateSeason(params.season),
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

    return {
        abbrev,
        season:
            params.season === "career"
                ? undefined
                : helpers.validateSeason(params.season),
        statType: params.statType !== undefined ? params.statType : "perGame",
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

    const inputs = {};
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(params.abbrev);
    inputs.season = helpers.validateSeason(params.season);

    return inputs;
};

const schedule = params => {
    const inputs = {};
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(params.abbrev);
    return inputs;
};

const teamFinances = params => {
    const inputs = {};
    inputs.show = params.show !== undefined ? params.show : "10";
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(params.abbrev);
    return inputs;
};

const teamHistory = params => {
    const inputs = {};
    inputs.show = params.show !== undefined ? params.show : "10";
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(params.abbrev);
    return inputs;
};

const teamRecords = params => {
    return {
        byType: params.byType || "team",
    };
};

const teamStats = params => {
    return {
        season: helpers.validateSeason(params.season),
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
        [tid, abbrev] = helpers.validateAbbrev(params.abbrev);
    } else if (params.abbrev && params.abbrev === "all") {
        tid = -1;
        abbrev = "all";
    } else {
        tid = g.userTid;
        abbrev = g.teamAbbrevsCache[tid];
    }

    let season;
    if (params.season && params.season !== "all") {
        season = helpers.validateSeason(params.season);
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
    let season = helpers.validateSeason(params.season);

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

const validateSeason = params => {
    return {
        season: helpers.validateSeason(params.season),
    };
};

export default {
    account,
    awardsRecords,
    customizePlayer,
    deleteLeague,
    draft,
    draftLottery,
    draftSummary,
    draftTeamHistory,
    eventLog,
    fantasyDraft,
    freeAgents,
    gameLog,
    history,
    leaders: validateSeason,
    leagueFinances: validateSeason,
    liveGame,
    message,
    negotiation,
    negotiationList,
    player,
    playerFeats,
    playerRatingDists: validateSeason,
    playerRatings,
    playerShotLocations: validateSeason,
    playerStatDists: validateSeason,
    playerStats,
    playoffs: validateSeason,
    resetPassword,
    roster,
    schedule,
    standings: validateSeason,
    teamFinances,
    teamHistory,
    teamRecords,
    teamShotLocations: teamStats,
    teamStatDists: validateSeason,
    teamStats,
    transactions,
    upcomingFreeAgents,
    watchList,
};
