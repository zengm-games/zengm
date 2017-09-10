import { PHASE, g, helpers } from "../common";

const account = ctx => {
    return {
        goldMessage:
            ctx.bbgm.goldResult !== undefined
                ? ctx.bbgm.goldResult.message
                : undefined,
        goldSuccess:
            ctx.bbgm.goldResult !== undefined
                ? ctx.bbgm.goldResult.success
                : undefined,
    };
};

const awardsRecords = ctx => {
    return {
        awardType: ctx.params.awardType || "champion",
    };
};

const customizePlayer = ctx => {
    if (ctx.params.hasOwnProperty("pid")) {
        return {
            pid: parseInt(ctx.params.pid, 10),
        };
    }

    return {
        pid: null,
    };
};

const deleteLeague = ctx => {
    return {
        lid: parseInt(ctx.params.lid, 10),
    };
};

const draft = () => {
    if (g.phase !== PHASE.DRAFT && g.phase !== PHASE.FANTASY_DRAFT) {
        return {
            redirectUrl: helpers.leagueUrl(["draft_summary"]),
        };
    }
};

const draftLottery = ctx => {
    const season = helpers.validateSeason(ctx.params.season);

    return {
        season,
    };
};

const draftSummary = ctx => {
    let season = helpers.validateSeason(ctx.params.season);

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

const eventLog = ctx => {
    const [tid, abbrev] = helpers.validateAbbrev(ctx.params.abbrev);

    return {
        tid,
        abbrev,
        season: helpers.validateSeason(ctx.params.season),
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

const gameLog = ctx => {
    return {
        abbrev: helpers.validateAbbrev(ctx.params.abbrev)[1],
        gid: ctx.params.gid !== undefined ? parseInt(ctx.params.gid, 10) : -1,
        season: helpers.validateSeason(ctx.params.season),
    };
};

const history = ctx => {
    let season = helpers.validateSeason(ctx.params.season);

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

const liveGame = ctx => {
    const obj = {
        fromAction: !!ctx.bbgm.fromAction,
    };
    if (ctx.bbgm.playByPlay !== undefined) {
        obj.gidPlayByPlay = ctx.bbgm.gidPlayByPlay;
        obj.playByPlay = ctx.bbgm.playByPlay;
    }
    return obj;
};

const message = ctx => {
    return {
        mid: ctx.params.mid ? parseInt(ctx.params.mid, 10) : undefined,
    };
};

const negotiation = ctx => {
    const pid = parseInt(ctx.params.pid, 10);

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

const player = ctx => {
    return {
        pid:
            ctx.params.pid !== undefined
                ? parseInt(ctx.params.pid, 10)
                : undefined,
    };
};

const playerFeats = ctx => {
    let abbrev;
    if (g.teamAbbrevsCache.includes(ctx.params.abbrev)) {
        abbrev = ctx.params.abbrev;
    } else {
        abbrev = "all";
    }

    let season;
    if (ctx.params.season && ctx.params.season !== "all") {
        season = helpers.validateSeason(ctx.params.season);
    } else {
        season = "all";
    }

    return {
        abbrev,
        season,
        playoffs:
            ctx.params.playoffs !== undefined
                ? ctx.params.playoffs
                : "regularSeason",
    };
};

const playerRatings = ctx => {
    let abbrev;
    if (g.teamAbbrevsCache.includes(ctx.params.abbrev)) {
        abbrev = ctx.params.abbrev;
    } else if (ctx.params.abbrev && ctx.params.abbrev === "watch") {
        abbrev = "watch";
    } else {
        abbrev = "all";
    }

    return {
        abbrev,
        season: helpers.validateSeason(ctx.params.season),
    };
};

const playerStats = ctx => {
    let abbrev;
    if (g.teamAbbrevsCache.includes(ctx.params.abbrev)) {
        abbrev = ctx.params.abbrev;
    } else if (ctx.params.abbrev && ctx.params.abbrev === "watch") {
        abbrev = "watch";
    } else {
        abbrev = "all";
    }

    return {
        abbrev,
        season:
            ctx.params.season === "career"
                ? undefined
                : helpers.validateSeason(ctx.params.season),
        statType:
            ctx.params.statType !== undefined ? ctx.params.statType : "perGame",
        playoffs:
            ctx.params.playoffs !== undefined
                ? ctx.params.playoffs
                : "regularSeason",
    };
};

const resetPassword = ctx => {
    return {
        token: ctx.params.token,
    };
};

const roster = ctx => {
    // Fix broken links
    if (ctx.params.abbrev === "FA") {
        return {
            redirectUrl: helpers.leagueUrl(["free_agents"]),
        };
    }

    const inputs = {};
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(ctx.params.abbrev);
    inputs.season = helpers.validateSeason(ctx.params.season);

    return inputs;
};

const schedule = ctx => {
    const inputs = {};
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(ctx.params.abbrev);
    return inputs;
};

const teamFinances = ctx => {
    const inputs = {};
    inputs.show = ctx.params.show !== undefined ? ctx.params.show : "10";
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(ctx.params.abbrev);
    return inputs;
};

const teamHistory = ctx => {
    const inputs = {};
    inputs.show = ctx.params.show !== undefined ? ctx.params.show : "10";
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(ctx.params.abbrev);
    return inputs;
};

const teamRecords = ctx => {
    return {
        byType: ctx.params.byType || "team",
    };
};

const transactions = ctx => {
    let abbrev;
    let tid;
    if (ctx.params.abbrev && ctx.params.abbrev !== "all") {
        [tid, abbrev] = helpers.validateAbbrev(ctx.params.abbrev);
    } else if (ctx.params.abbrev && ctx.params.abbrev === "all") {
        tid = -1;
        abbrev = "all";
    } else {
        tid = g.userTid;
        abbrev = g.teamAbbrevsCache[tid];
    }

    let season;
    if (ctx.params.season && ctx.params.season !== "all") {
        season = helpers.validateSeason(ctx.params.season);
    } else if (ctx.params.season && ctx.params.season === "all") {
        season = "all";
    } else {
        season = g.season;
    }

    return {
        tid,
        abbrev,
        season,
        eventType: ctx.params.eventType || "all",
    };
};

const upcomingFreeAgents = ctx => {
    let season = helpers.validateSeason(ctx.params.season);

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

const watchList = ctx => {
    return {
        statType:
            ctx.params.statType !== undefined ? ctx.params.statType : "perGame",
        playoffs:
            ctx.params.playoffs !== undefined
                ? ctx.params.playoffs
                : "regularSeason",
    };
};

const validateSeason = ctx => {
    return {
        season: helpers.validateSeason(ctx.params.season),
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
    teamShotLocations: validateSeason,
    teamStatDists: validateSeason,
    teamStats: validateSeason,
    transactions,
    upcomingFreeAgents,
    watchList,
};
