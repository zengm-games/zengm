// @flow

import { PHASE, PLAYER, g, helpers } from "../../common";
import { season, team } from "../core";
import { idb } from "../db";
import { getProcessedGames } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

async function updateInbox(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (updateEvents.includes("firstRun")) {
        const messages = await idb.getCopies.messages({ limit: 2 });
        messages.reverse();

        for (let i = 0; i < messages.length; i++) {
            delete messages[i].text;
        }

        return {
            messages,
        };
    }
}

async function updateTeam(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("gameSim") ||
        updateEvents.includes("playerMovement") ||
        updateEvents.includes("newPhase")
    ) {
        const [t, latestSeason] = await Promise.all([
            idb.cache.teams.get(g.userTid),
            idb.cache.teamSeasons.indexGet(
                "teamSeasonsBySeasonTid",
                `${g.season},${g.userTid}`,
            ),
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
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("playerMovement")
    ) {
        const payroll = (await team.getPayroll(g.userTid))[0];
        return {
            payroll: payroll / 1000, // [millions of dollars]
        };
    }
}

async function updateTeams(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("gameSim") ||
        updateEvents.includes("playerMovement") ||
        updateEvents.includes("newPhase")
    ) {
        const vars = {};
        const stats = ["pts", "oppPts", "trb", "ast"]; // This is also used later to find ranks for these team stats

        const teams = helpers.orderByWinp(
            await idb.getCopies.teamsPlus({
                attrs: ["tid", "cid"],
                seasonAttrs: ["won", "winp", "att", "revenue", "profit"],
                stats,
                season: g.season,
            }),
        );

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
        vars.oppPtsRank = g.numTeams + 1 - vars.oppPtsRank;

        return vars;
    }
}

async function updateGames(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    const NUM_SHOW_COMPLETED = 4;
    if (updateEvents.includes("firstRun")) {
        // Load all games in list - would be more efficient to just load NUM_SHOW_COMPLETED
        const games = await getProcessedGames(
            g.teamAbbrevsCache[g.userTid],
            g.season,
        );

        const completed = games
            .slice(0, NUM_SHOW_COMPLETED)
            .map(game => helpers.formatCompletedGame(game));

        return { completed };
    }
    if (updateEvents.includes("gameSim")) {
        const completed = Array.isArray(state.completed) ? state.completed : [];
        // Partial update of only new games
        const games = await getProcessedGames(
            g.teamAbbrevsCache[g.userTid],
            g.season,
            state.completed,
        );
        for (let i = games.length - 1; i >= 0; i--) {
            completed.unshift(helpers.formatCompletedGame(games[i]));
            if (completed.length > NUM_SHOW_COMPLETED) {
                completed.pop();
            }
        }

        return { completed };
    }
}

async function updateSchedule(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("gameSim") ||
        updateEvents.includes("newPhase")
    ) {
        const schedule = await season.getSchedule();
        const games = [];
        const numShowUpcoming = 3;
        for (let i = 0; i < schedule.length; i++) {
            const game = schedule[i];
            if (g.userTid === game.homeTid || g.userTid === game.awayTid) {
                const team0 = {
                    tid: game.homeTid,
                    abbrev: g.teamAbbrevsCache[game.homeTid],
                    region: g.teamRegionsCache[game.homeTid],
                    name: g.teamNamesCache[game.homeTid],
                };
                const team1 = {
                    tid: game.awayTid,
                    abbrev: g.teamAbbrevsCache[game.awayTid],
                    region: g.teamRegionsCache[game.awayTid],
                    name: g.teamNamesCache[game.awayTid],
                };

                games.push({ gid: game.gid, teams: [team1, team0] });
            }

            if (games.length >= numShowUpcoming) {
                break;
            }
        }
        return { upcoming: games };
    }
}

async function updatePlayers(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("gameSim") ||
        updateEvents.includes("playerMovement") ||
        updateEvents.includes("newPhase")
    ) {
        const vars = {};

        let players = await idb.cache.players.indexGetAll("playersByTid", [
            PLAYER.UNDRAFTED,
            Infinity,
        ]);
        players = await idb.getCopies.playersPlus(players, {
            attrs: [
                "pid",
                "name",
                "abbrev",
                "tid",
                "age",
                "contract",
                "rosterOrder",
                "injury",
            ],
            ratings: ["ovr", "pot", "dovr", "dpot", "skills", "pos"],
            stats: ["gp", "min", "pts", "trb", "ast", "per", "yearsWithTeam"],
            season: g.season,
            showNoStats: true,
            showRookies: true,
            fuzz: true,
        });

        // League leaders
        vars.leagueLeaders = {};
        const stats = ["pts", "trb", "ast"]; // Categories for leaders
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
                    name: "",
                    stat: 0,
                };
            }
        }

        // Roster
        // Find starting 5
        vars.starters = userPlayers
            .sort((a, b) => a.rosterOrder - b.rosterOrder)
            .slice(0, 5);

        return vars;
    }
}

async function updatePlayoffs(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        (g.phase >= PHASE.PLAYOFFS && updateEvents.includes("gameSim")) ||
        (updateEvents.includes("newPhase") && g.phase === PHASE.PLAYOFFS)
    ) {
        const playoffSeries = await idb.getCopy.playoffSeries({
            season: g.season,
        });

        let foundSeries;
        let seriesTitle = "";
        let showPlayoffSeries = false;

        if (playoffSeries !== undefined) {
            const series = playoffSeries.series;
            let found = false;

            // Find the latest playoff series with the user's team in it
            for (let rnd = playoffSeries.currentRound; rnd >= 0; rnd--) {
                for (let i = 0; i < series[rnd].length; i++) {
                    if (
                        series[rnd][i].home.tid === g.userTid ||
                        series[rnd][i].away.tid === g.userTid
                    ) {
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
): void | { [key: string]: any } {
    if (updateEvents.includes("firstRun") || updateEvents.includes("gameSim")) {
        const teams = helpers.orderByWinp(
            await idb.getCopies.teamsPlus({
                attrs: ["tid", "cid", "abbrev", "region"],
                seasonAttrs: ["won", "lost", "winp"],
                season: g.season,
            }),
        );

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
                    confTeams[l].gb = helpers.gb(
                        confTeams[0].seasonAttrs,
                        confTeams[l].seasonAttrs,
                    );
                }
                l += 1;
            }
        }

        const playoffsByConference = g.confs.length === 2; // && !localStorage.getItem('top16playoffs');

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
