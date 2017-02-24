import Promise from 'bluebird';
import g from '../../globals';
import * as trade from '../core/trade';
import {getCopy} from '../db';
import bbgmViewReact from '../../util/bbgmViewReact';
import * as helpers from '../../util/helpers';
import Trade from '../../ui/views/Trade';

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

    vars.summary.teams = [];
    for (let i = 0; i < 2; i++) {
        vars.summary.teams[i] = {
            name: summary.teams[i].name,
            payrollAfterTrade: summary.teams[i].payrollAfterTrade,
            total: summary.teams[i].total,
            trade: summary.teams[i].trade,
            picks: summary.teams[i].picks,
            other: i === 0 ? 1 : 0,  // Index of other team
        };
    }

    return vars;
}

// Validate that the stored player IDs correspond with the active team ID
async function validateSavedPids() {
    const {teams} = await g.cache.get('trade', 0);
    return trade.updatePlayers(teams);
}

async function updateTrade() {
    let [teams, userRoster, userPicks] = await Promise.all([
        validateSavedPids(),
        g.cache.indexGetAll('playersByTid', g.userTid),
        g.cache.indexGetAll('draftPicksByTid', g.userTid),
    ]);

    const attrs = ["pid", "name", "age", "contract", "injury", "watch", "gamesUntilTradable"];
    const ratings = ["ovr", "pot", "skills", "pos"];
    const stats = ["min", "pts", "trb", "ast", "per"];

    userRoster = await getCopy.playersPlus(userRoster, {
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
    let [otherRoster, otherPicks, t] = await Promise.all([
        g.cache.indexGetAll('playersByTid', otherTid),
        g.cache.indexGetAll('draftPicksByTid', otherTid),
        getCopy.teams({
            tid: otherTid,
            season: g.season,
            attrs: ["strategy"],
            seasonAttrs: ["won", "lost"],
        }),
    ]);

    otherRoster = await getCopy.playersPlus(otherRoster, {
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

    let vars = {
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
    if (g.phase > g.PHASE.PLAYOFFS && g.phase < g.PHASE.FREE_AGENCY) {
        vars.showResigningMsg = true;
    } else {
        vars.showResigningMsg = false;
    }

    return vars;
}

export default bbgmViewReact.init({
    id: "trade",
    runBefore: [updateTrade],
    Component: Trade,
});
