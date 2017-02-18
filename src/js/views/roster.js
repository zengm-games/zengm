import Promise from 'bluebird';
import g from '../globals';
import * as player from '../core/player';
import * as season from '../core/season';
import * as team from '../core/team';
import * as trade from '../core/trade';
import {getCopy} from '../db';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import Roster from './views/Roster';

function get(ctx) {
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
}

async function updateRoster(inputs, updateEvents, state) {
    if (updateEvents.includes('dbChange') || (inputs.season === g.season && (updateEvents.includes('gameSim') || updateEvents.includes('playerMovement'))) || inputs.abbrev !== state.abbrev || inputs.season !== state.season) {
        const vars = {
            abbrev: inputs.abbrev,
            season: inputs.season,
            editable: inputs.season === g.season && inputs.tid === g.userTid,
            salaryCap: g.salaryCap / 1000,
            showTradeFor: inputs.season === g.season && inputs.tid !== g.userTid,
        };

        vars.t = await getCopy.teams({
            season: inputs.season,
            tid: inputs.tid,
            attrs: ["tid", "region", "name", "strategy", "imgURL"],
            seasonAttrs: ["profit", "won", "lost", "playoffRoundsWon"],
        });

        return g.dbl.tx(["players", "playerStats", "releasedPlayers", "schedule"], async tx => {
            const attrs = ["pid", "tid", "draft", "name", "age", "contract", "cashOwed", "rosterOrder", "injury", "ptModifier", "watch", "gamesUntilTradable"];  // tid and draft are used for checking if a player can be released without paying his salary
            const ratings = ["ovr", "pot", "dovr", "dpot", "skills", "pos"];
            const stats = ["gp", "min", "pts", "trb", "ast", "per", "yearsWithTeam"];

            if (inputs.season === g.season) {
                // Show players currently on the roster
                let [schedule, players, payroll] = await Promise.all([
                    season.getSchedule(),
                    g.cache.indexGetAll('playersByTid', inputs.tid),
                    team.getPayroll(inputs.tid).get(0),
                ]);

                // numGamesRemaining doesn't need to be calculated except for g.userTid, but it is.
                let numGamesRemaining = 0;
                for (let i = 0; i < schedule.length; i++) {
                    if (inputs.tid === schedule[i].homeTid || inputs.tid === schedule[i].awayTid) {
                        numGamesRemaining += 1;
                    }
                }

                players = await getCopy.players(players, {
                    attrs,
                    ratings,
                    stats,
                    season: inputs.season,
                    tid: inputs.tid,
                    showNoStats: true,
                    showRookies: true,
                    fuzz: true,
                    numGamesRemaining,
                });
                players.sort((a, b) => a.rosterOrder - b.rosterOrder);
console.log(players);

                // Add untradable property
                players = trade.filterUntradable(players);

                for (let i = 0; i < players.length; i++) {
                    // Can release from user's team, except in playoffs because then no free agents can be signed to meet the minimum roster requirement
                    if (inputs.tid === g.userTid && (g.phase !== g.PHASE.PLAYOFFS || players.length > 15) && !g.gameOver && players.length > 5) {
                        players[i].canRelease = true;
                    } else {
                        players[i].canRelease = false;
                    }

                    // Convert ptModifier to string so it doesn't cause unneeded knockout re-rendering
                    players[i].ptModifier = String(players[i].ptModifier);
                }

                vars.players = players;
                vars.payroll = payroll / 1000;
            } else {
                // Show all players with stats for the given team and year
                // Needs all seasons because of YWT!
                let players = tx.players.index('statsTids').getAll(inputs.tid);
                players = await player.withStats(tx, players, {
                    statsSeasons: "all",
                    statsTid: inputs.tid,
                });

                players = player.filter(players, {
                    attrs,
                    ratings,
                    stats,
                    season: inputs.season,
                    tid: inputs.tid,
                    fuzz: true,
                });
                players.sort((a, b) => b.stats.gp * b.stats.min - a.stats.gp * a.stats.min);

                // This is not immediately needed, because players from past seasons don't have the "Trade For" button displayed. However, if an old season is loaded first and then a new season is switched to, Knockout will try to display the Trade For button before all the player objects are updated to include it. I think it might be the komapping.fromJS part from bbgmView not applying everything at exactly the same time.
                players = trade.filterUntradable(players);

                for (let i = 0; i < players.length; i++) {
                    players[i].age -= g.season - inputs.season;
                    players[i].canRelease = false;
                }

                vars.players = players;
                vars.payroll = null;
            }

            return vars;
        });
    }
}

export default bbgmViewReact.init({
    id: "roster",
    get,
    runBefore: [updateRoster],
    Component: Roster,
});
