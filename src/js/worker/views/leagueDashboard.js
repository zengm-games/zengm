// @flow

import Promise from 'bluebird';
import {PHASE, PLAYER} from '../../common';
import g from '../../globals';
import * as season from '../core/season';
import * as team from '../core/team';
import {getCopy} from '../db';
import * as helpers from '../../util/helpers';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updateInbox(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun')) {
        let messages = await getCopy.messages();
        messages.reverse();

        for (let i = 0; i < messages.length; i++) {
            delete messages[i].text;
        }
        messages = messages.slice(0, 2);

        return {
            messages,
        };
    }
}

async function updateTeam(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || updateEvents.includes('gameSim') || updateEvents.includes('playerMovement') || updateEvents.includes('newPhase')) {
        const [t, latestSeason] = await Promise.all([
            g.cache.get('teams', g.userTid),
            g.cache.indexGet('teamSeasonsBySeasonTid', `${g.season},${g.userTid}`),
        ]);

        return {
            region: t.region,
            name: t.name,
            abbrev: t.abbrev,
            won: latestSeason.won,
            lost: latestSeason.lost,
            cash: latestSeason.cash / 1000, // [millions of dollars]
            salaryCap: g.salaryCap / 1000, // [millions of dollars]
            season: g.season,
            playoffRoundsWon: latestSeason.playoffRoundsWon,
        };
    }
}

async function updatePayroll(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || updateEvents.includes('playerMovement')) {
        const payroll = await team.getPayroll(g.userTid).get(0);
        return {
            payroll: payroll / 1000, // [millions of dollars]
        };
    }
}


async function updateTeams(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || updateEvents.includes('gameSim') || updateEvents.includes('playerMovement') || updateEvents.includes('newPhase')) {
        const vars = {};
        const stats = ["pts", "oppPts", "trb", "ast"];  // This is also used later to find ranks for these team stats

        const teams = helpers.orderByWinp(await getCopy.teams({
            attrs: ["tid", "cid"],
            seasonAttrs: ["won", "winp", "att", "revenue", "profit"],
            stats,
            season: g.season,
        }));

        const t = teams.find(t2 => t2.tid === g.userTid);
        const cid = t !== undefined ? t.cid : undefined;

        vars.rank = 1;
        for (let i = 0; i < teams.length; i++) {
            if (teams[i].cid === cid) {
                if (teams[i].tid === g.userTid) {
                    vars.pts = teams[i].stats.pts;
                    vars.oppPts = teams[i].stats.oppPts;
                    vars.trb = teams[i].stats.trb;
                    vars.ast = teams[i].stats.ast;

                    vars.att = teams[i].seasonAttrs.att;
                    vars.revenue = teams[i].seasonAttrs.revenue;
                    vars.profit = teams[i].seasonAttrs.profit;
                    break;
                } else {
                    vars.rank += 1;
                }
            }
        }

        for (let i = 0; i < stats.length; i++) {
            teams.sort((a, b) => b.stats[stats[i]] - a.stats[stats[i]]);
            for (let j = 0; j < teams.length; j++) {
                if (teams[j].tid === g.userTid) {
                    vars[`${stats[i]}Rank`] = j + 1;
                    break;
                }
            }
        }
        vars.oppPtsRank = 31 - vars.oppPtsRank;

        return vars;
    }
}

async function updateGames(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || updateEvents.includes('gameSim') || updateEvents.includes('newPhase')) {
        const numShowCompleted = 4;
        const completed = [];

        // This could be made much faster by using a compound index to search for season + team, but that's not supported by IE 10
        await g.dbl.games.index('season').iterate(g.season, "prev", (game, shortCircuit) => {
            if (completed.length >= numShowCompleted) {
                return shortCircuit();
            }

            let overtime;
            if (game.overtimes === 1) {
                overtime = " (OT)";
            } else if (game.overtimes > 1) {
                overtime = ` (${game.overtimes}OT)`;
            } else {
                overtime = "";
            }

            // Check tid
            if (game.teams[0].tid === g.userTid || game.teams[1].tid === g.userTid) {
                const i = game.teams[0].tid === g.userTid ? 0 : 1;
                const j = 1 - i;

                completed.push(helpers.formatCompletedGame({
                    gid: game.gid,
                    overtime,
                    home: i === 0,
                    pts: game.teams[i].pts,
                    oppPts: game.teams[j].pts,
                    oppTid: game.teams[j].tid,
                    oppAbbrev: g.teamAbbrevsCache[game.teams[j].tid],
                    won: game.teams[i].pts > game.teams[j].pts,
                }));
            }
        });

        return {completed};
    }
}

async function updateSchedule(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || updateEvents.includes('gameSim') || updateEvents.includes('newPhase')) {
        const schedule = await season.getSchedule();
        const games = [];
        const numShowUpcoming = 3;
        for (let i = 0; i < schedule.length; i++) {
            const game = schedule[i];
            if (g.userTid === game.homeTid || g.userTid === game.awayTid) {
                const team0 = {tid: game.homeTid, abbrev: g.teamAbbrevsCache[game.homeTid], region: g.teamRegionsCache[game.homeTid], name: g.teamNamesCache[game.homeTid]};
                const team1 = {tid: game.awayTid, abbrev: g.teamAbbrevsCache[game.awayTid], region: g.teamRegionsCache[game.awayTid], name: g.teamNamesCache[game.awayTid]};

                games.push({gid: game.gid, teams: [team1, team0]});
            }

            if (games.length >= numShowUpcoming) {
                break;
            }
        }
        return {upcoming: games};
    }
}

async function updatePlayers(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || updateEvents.includes('gameSim') || updateEvents.includes('playerMovement') || updateEvents.includes('newPhase')) {
        const vars = {};

        let players = await g.cache.indexGetAll('playersByTid', [PLAYER.UNDRAFTED, Infinity]);
        players = await getCopy.playersPlus(players, {
            attrs: ['pid', 'name', 'abbrev', 'tid', 'age', 'contract', 'rosterOrder', 'injury', 'watch'],
            ratings: ['ovr', 'pot', 'dovr', 'dpot', 'skills', 'pos'],
            stats: ['gp', 'min', 'pts', 'trb', 'ast', 'per', 'yearsWithTeam'],
            season: g.season,
            showNoStats: true,
            showRookies: true,
            fuzz: true,
        });

        // League leaders
        vars.leagueLeaders = {};
        const stats = ['pts', 'trb', 'ast']; // Categories for leaders
        for (const stat of stats) {
            players.sort((a, b) => b.stats[stat] - a.stats[stat]);
            vars.leagueLeaders[stat] = {
                pid: players[0].pid,
                name: players[0].name,
                abbrev: players[0].abbrev,
                stat: players[0].stats[stat],
            };
        }

        // Team leaders
        const userPlayers = players.filter(p => p.tid === g.userTid);
        vars.teamLeaders = {};
        for (const stat of stats) {
            if (userPlayers.length > 0) {
                userPlayers.sort((a, b) => b.stats[stat] - a.stats[stat]);
                vars.teamLeaders[stat] = {
                    pid: userPlayers[0].pid,
                    name: userPlayers[0].name,
                    stat: userPlayers[0].stats[stat],
                };
            } else {
                vars.teamLeaders[stat] = {
                    pid: 0,
                    name: '',
                    stat: 0,
                };
            }
        }

        // Roster
        // Find starting 5
        vars.starters = userPlayers.sort((a, b) => a.rosterOrder - b.rosterOrder).slice(0, 5);

        return vars;
    }
}

async function updatePlayoffs(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || (g.phase >= PHASE.PLAYOFFS && updateEvents.includes('gameSim')) || (updateEvents.includes('newPhase') && g.phase === PHASE.PLAYOFFS)) {
        const playoffSeries = await getCopy.playoffSeries({season: g.season});

        let foundSeries;
        let seriesTitle = '';
        let showPlayoffSeries = false;

        if (playoffSeries !== undefined) {
            const series = playoffSeries.series;
            let found = false;

            // Find the latest playoff series with the user's team in it
            for (let rnd = playoffSeries.currentRound; rnd >= 0; rnd--) {
                for (let i = 0; i < series[rnd].length; i++) {
                    if (series[rnd][i].home.tid === g.userTid || series[rnd][i].away.tid === g.userTid) {
                        foundSeries = series[rnd][i];
                        found = true;
                        showPlayoffSeries = true;
                        if (rnd === 0) {
                            seriesTitle = "First Round";
                        } else if (rnd === 1) {
                            seriesTitle = "Second Round";
                        } else if (rnd === 2) {
                            seriesTitle = "Conference Finals";
                        } else if (rnd === 3) {
                            seriesTitle = "League Finals";
                        }
                        break;
                    }
                }
                if (found) {
                    break;
                }
            }
        }

        return {
            series: foundSeries,
            seriesTitle,
            showPlayoffSeries,
        };
    }
}

async function updateStandings(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || updateEvents.includes('gameSim')) {
        const teams = helpers.orderByWinp(await getCopy.teams({
            attrs: ["tid", "cid", "abbrev", "region"],
            seasonAttrs: ["won", "lost", "winp"],
            season: g.season,
        }));

        // Find user's conference
        let cid;
        for (const t of teams) {
            if (t.tid === g.userTid) {
                cid = t.cid;
                break;
            }
        }

        const confTeams = [];
        let l = 0;
        for (let k = 0; k < teams.length; k++) {
            if (cid === teams[k].cid) {
                confTeams.push(helpers.deepCopy(teams[k]));
                confTeams[l].rank = l + 1;
                if (l === 0) {
                    confTeams[l].gb = 0;
                } else {
                    confTeams[l].gb = helpers.gb(confTeams[0].seasonAttrs, confTeams[l].seasonAttrs);
                }
                l += 1;
            }
        }

        const playoffsByConference = g.confs.length === 2 && !localStorage.getItem('top16playoffs');

        return {
            confTeams,
            playoffsByConference,
        };
    }
}

export default {
    runBefore: [
        updateInbox,
        updateTeam,
        updatePayroll,
        updateTeams,
        updateGames,
        updateSchedule,
        updatePlayers,
        updatePlayoffs,
        updateStandings,
    ],
};
