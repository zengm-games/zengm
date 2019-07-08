// @flow

import { PHASE } from "../../common";
import { team, trade } from "../core";
import { idb } from "../db";
import { g, helpers } from "../util";

// This relies on vars being populated, so it can't be called in parallel with updateTrade
async function updateSummary(vars) {
    const otherTid = await trade.getOtherTid();
    const teams = [
        {
            tid: g.userTid,
            pids: vars.userPids,
            pidsExcluded: vars.userPidsExcluded,
            dpids: vars.userDpids,
            dpidsExcluded: vars.userDpidsExcluded,
        },
        {
            tid: otherTid,
            pids: vars.otherPids,
            pidsExcluded: vars.userPidsExcluded,
            dpids: vars.otherDpids,
            dpidsExcluded: vars.userDpidsExcluded,
        },
    ];

    const summary = await trade.summary(teams);
    vars.summary = {
        enablePropose:
            !summary.warning &&
            (teams[0].pids.length > 0 ||
                teams[0].dpids.length > 0 ||
                teams[1].pids.length > 0 ||
                teams[1].dpids.length > 0),
        warning: summary.warning,
    };

    vars.summary.teams = [0, 1].map(i => {
        return {
            name: summary.teams[i].name,
            payrollAfterTrade: summary.teams[i].payrollAfterTrade,
            total: summary.teams[i].total,
            trade: summary.teams[i].trade,
            picks: summary.teams[i].picks,
            other: i === 0 ? 1 : 0, // Index of other team
        };
    });

    return vars;
}

// Validate that the stored player IDs correspond with the active team ID
const validateTeams = async () => {
    const { teams } = await idb.cache.trade.get(0);

    // Handle case where multi team mode is used to switch teams, but a trade was already happening with the team that was just switched to
    if (teams[0].tid !== g.userTid) {
        teams[1] = {
            tid: g.userTid,
            pids: [],
            pidsExcluded: [],
            dpids: [],
            dpidsExcluded: [],
        };
    }
    if (teams[1].tid === g.userTid || teams[1].tid >= g.numTeams) {
        teams[1] = {
            tid: g.userTid === 0 ? 1 : 0,
            pids: [],
            pidsExcluded: [],
            dpids: [],
            dpidsExcluded: [],
        };
    }

    // This is just for debugging
    team.valueChange(
        teams[1].tid,
        teams[0].pids,
        teams[1].pids,
        teams[0].dpids,
        teams[1].dpids,
    ).then(dv => {
        console.log(dv);
    });
    return trade.updatePlayers(teams);
};

async function updateTrade(): void | { [key: string]: any } {
    const teams = await validateTeams();
    let userRoster = await idb.cache.players.indexGetAll(
        "playersByTid",
        g.userTid,
    );
    const userPicks: any = await idb.getCopies.draftPicks({ tid: g.userTid });

    const attrs = [
        "pid",
        "name",
        "age",
        "contract",
        "injury",
        "watch",
        "untradable",
    ];
    const ratings = ["ovr", "pot", "skills", "pos"];
    const stats =
        process.env.SPORT === "basketball"
            ? ["min", "pts", "trb", "ast", "per"]
            : ["gp", "keyStats", "av"];

    userRoster = await idb.getCopies.playersPlus(userRoster, {
        attrs,
        ratings,
        stats,
        season: g.season,
        tid: g.userTid,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });

    for (const p of userRoster) {
        p.included = teams[0].pids.includes(p.pid);
        p.excluded = teams[0].pidsExcluded.includes(p.pid);
    }

    for (const dp of userPicks) {
        dp.desc = helpers.pickDesc(dp);
        dp.included = teams[0].dpids.includes(dp.dpid);
        dp.excluded = teams[0].dpidsExcluded.includes(dp.dpid);
    }

    const otherTid = teams[1].tid;

    // Need to do this after knowing otherTid
    let otherRoster = await idb.cache.players.indexGetAll(
        "playersByTid",
        otherTid,
    );
    const otherPicks: any = await idb.getCopies.draftPicks({ tid: otherTid });
    const t = await idb.getCopy.teamsPlus({
        tid: otherTid,
        season: g.season,
        attrs: ["strategy"],
        seasonAttrs: ["won", "lost", "tied"],
    });

    if (t === undefined) {
        return {
            errorMessage: `Invalid team ID "${otherTid}".`,
        };
    }

    otherRoster = await idb.getCopies.playersPlus(otherRoster, {
        attrs,
        ratings,
        stats,
        season: g.season,
        tid: otherTid,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });

    for (const p of otherRoster) {
        p.included = teams[1].pids.includes(p.pid);
        p.excluded = teams[1].pidsExcluded.includes(p.pid);
    }

    for (const dp of otherPicks) {
        dp.desc = helpers.pickDesc(dp);
        dp.included = teams[1].dpids.includes(dp.dpid);
        dp.excluded = teams[1].dpidsExcluded.includes(dp.dpid);
    }

    let vars: any = {
        salaryCap: g.salaryCap / 1000,
        userDpids: teams[0].dpids,
        userDpidsExcluded: teams[0].dpidsExcluded,
        userPicks,
        userPids: teams[0].pids,
        userPidsExcluded: teams[0].pidsExcluded,
        userRoster,
        otherDpids: teams[1].dpids,
        otherDpidsExcluded: teams[1].dpidsExcluded,
        otherPicks,
        otherPids: teams[1].pids,
        otherPidsExcluded: teams[1].pidsExcluded,
        otherRoster,
        otherTid,
        stats,
        strategy: t.strategy,
        won: t.seasonAttrs.won,
        lost: t.seasonAttrs.lost,
        tied: t.seasonAttrs.tied,
        ties: g.ties,
        gameOver: g.gameOver,
        godMode: g.godMode,
        forceTrade: false,
        phase: g.phase,
        userTid: g.userTid,
    };
    vars = await updateSummary(vars);

    // Always run this, for multi team mode
    vars.teams = [];
    for (let tid = 0; tid < g.numTeams; tid++) {
        vars.teams[tid] = {
            name: g.teamNamesCache[tid],
            region: g.teamRegionsCache[tid],
            tid,
        };
    }
    vars.teams.splice(g.userTid, 1); // Can't trade with yourself
    vars.userTeamName = `${g.teamRegionsCache[g.userTid]} ${
        g.teamNamesCache[g.userTid]
    }`;

    // If the season is over, can't trade players whose contracts are expired
    vars.showResigningMsg =
        g.phase > PHASE.PLAYOFFS && g.phase < PHASE.FREE_AGENCY;

    return vars;
}

export default {
    runBefore: [updateTrade],
};
