// @flow

import {PHASE, g, helpers} from '../../common';
import {team, trade} from '../core';
import {idb} from '../db';

// This relies on vars being populated, so it can't be called in parallel with updateTrade
async function updateSummary(vars) {
    const otherTid = await trade.getOtherTid();
    const teams = [{
        tid: g.userTid,
        pids: vars.userPids,
        dpids: vars.userDpids,
    }, {
        tid: otherTid,
        pids: vars.otherPids,
        dpids: vars.otherDpids,
    }];

    const summary = await trade.summary(teams);
    vars.summary = {
        enablePropose: !summary.warning && (teams[0].pids.length > 0 || teams[0].dpids.length > 0 || teams[1].pids.length > 0 || teams[1].dpids.length > 0),
        warning: summary.warning,
    };

    vars.summary.teams = [0, 1].map((i) => {
        return {
            name: summary.teams[i].name,
            payrollAfterTrade: summary.teams[i].payrollAfterTrade,
            total: summary.teams[i].total,
            trade: summary.teams[i].trade,
            picks: summary.teams[i].picks,
            other: i === 0 ? 1 : 0,  // Index of other team
        };
    });

    return vars;
}

// Validate that the stored player IDs correspond with the active team ID
async function validateSavedPids() {
    const {teams} = await idb.cache.trade.get(0);

    // This is just for debugging
    team.valueChange(teams[1].tid, teams[0].pids, teams[1].pids, teams[0].dpids, teams[1].dpids).then(dv => {
        console.log(dv);
    });
    return trade.updatePlayers(teams);
}

async function updateTrade(): void | {[key: string]: any} {
    const teams = await validateSavedPids();
    let userRoster = await idb.cache.players.indexGetAll('playersByTid', g.userTid);
    const userPicks: any = await idb.cache.draftPicks.indexGetAll('draftPicksByTid', g.userTid);

    const attrs = ["pid", "name", "age", "contract", "injury", "watch", "gamesUntilTradable"];
    const ratings = ["ovr", "pot", "skills", "pos"];
    const stats = ["min", "pts", "trb", "ast", "per"];

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
    userRoster = trade.filterUntradable(userRoster);

    for (let i = 0; i < userRoster.length; i++) {
        if (teams[0].pids.includes(userRoster[i].pid)) {
            userRoster[i].selected = true;
        } else {
            userRoster[i].selected = false;
        }
    }

    for (let i = 0; i < userPicks.length; i++) {
        userPicks[i].desc = helpers.pickDesc(userPicks[i]);
    }

    const otherTid = teams[1].tid;

    // Need to do this after knowing otherTid
    let otherRoster = await idb.cache.players.indexGetAll('playersByTid', otherTid);
    const otherPicks: any = await idb.cache.draftPicks.indexGetAll('draftPicksByTid', otherTid);
    const t = await idb.getCopy.teamsPlus({
        tid: otherTid,
        season: g.season,
        attrs: ["strategy"],
        seasonAttrs: ["won", "lost"],
    });

    if (t === undefined) {
        throw new Error(`Invalid team ID ${otherTid}`);
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
    otherRoster = trade.filterUntradable(otherRoster);

    for (let i = 0; i < otherRoster.length; i++) {
        if (teams[1].pids.includes(otherRoster[i].pid)) {
            otherRoster[i].selected = true;
        } else {
            otherRoster[i].selected = false;
        }
    }

    for (let i = 0; i < otherPicks.length; i++) {
        otherPicks[i].desc = helpers.pickDesc(otherPicks[i]);
    }

    let vars: any = {
        salaryCap: g.salaryCap / 1000,
        userDpids: teams[0].dpids,
        userPicks,
        userPids: teams[0].pids,
        userRoster,
        otherDpids: teams[1].dpids,
        otherPicks,
        otherPids: teams[1].pids,
        otherRoster,
        otherTid,
        strategy: t.strategy,
        won: t.seasonAttrs.won,
        lost: t.seasonAttrs.lost,
        gameOver: g.gameOver,
        godMode: g.godMode,
        forceTrade: false,
        phase: g.phase,
    };
    vars = await updateSummary(vars);

    // Always run this, for multi team mode
    vars.teams = [];
    for (let i = 0; i < g.numTeams; i++) {
        vars.teams[i] = {
            abbrev: g.teamAbbrevsCache[i],
            region: g.teamRegionsCache[i],
            name: g.teamNamesCache[i],
        };
    }
    vars.teams.splice(g.userTid, 1); // Can't trade with yourself
    vars.userTeamName = `${g.teamRegionsCache[g.userTid]} ${g.teamNamesCache[g.userTid]}`;

    // If the season is over, can't trade players whose contracts are expired
    vars.showResigningMsg = g.phase > PHASE.PLAYOFFS && g.phase < PHASE.FREE_AGENCY;

    return vars;
}

export default {
    runBefore: [updateTrade],
};
