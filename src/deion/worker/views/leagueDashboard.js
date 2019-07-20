// @flow

import { PHASE, PLAYER } from "../../common";
import { season, team } from "../core";
import { idb } from "../db";
import { g, getProcessedGames, helpers } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

async function updateInbox(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("newPhase")
    ) {
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
            idb.cache.teamSeasons.indexGet("teamSeasonsBySeasonTid", [
                g.season,
                g.userTid,
            ]),
        ]);

        return {
            region: t.region,
            name: t.name,
            abbrev: t.abbrev,
            won: latestSeason !== undefined ? latestSeason.won : 0,
            lost: latestSeason !== undefined ? latestSeason.lost : 0,
            tied: latestSeason !== undefined ? latestSeason.tied : 0,
            ties: g.ties,
            cash: latestSeason !== undefined ? latestSeason.cash / 1000 : 0, // [millions of dollars]
            salaryCap: g.salaryCap / 1000, // [millions of dollars]
            season: g.season,
            playoffRoundsWon:
                latestSeason !== undefined ? latestSeason.playoffRoundsWon : 0,
            numGames: g.numGames,
            phase: g.phase,
            userTid: g.userTid,
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
        const payroll = await team.getPayroll(g.userTid);
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
        const stats =
            process.env.SPORT === "basketball"
                ? ["pts", "oppPts", "trb", "ast"]
                : [
                      "ptsPerGame",
                      "oppPtsPerGame",
                      "pssYdsPerGame",
                      "rusYdsPerGame",
                  ];
        const statNames =
            process.env.SPORT === "basketball"
                ? ["Points", "Allowed", "Rebounds", "Assists"]
                : ["Points", "Allowed", "PssYds", "RusYds"];

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

        let att = 0;
        let rank = 1;
        let revenue = 0;
        let profit = 0;
        let teamStats = [];
        for (const t2 of teams) {
            if (t2.cid === cid) {
                if (t2.tid === g.userTid) {
                    teamStats = stats.map((stat, i) => {
                        return {
                            name: statNames[i],
                            rank: 0,
                            stat,
                            value: t2.stats[stats[i]],
                        };
                    });
                    att = t2.seasonAttrs.att;
                    revenue = t2.seasonAttrs.revenue;
                    profit = t2.seasonAttrs.profit;
                    break;
                } else {
                    rank += 1;
                }
            }
        }

        for (const stat of stats) {
            teams.sort((a, b) => b.stats[stat] - a.stats[stat]);
            for (let j = 0; j < teams.length; j++) {
                if (teams[j].tid === g.userTid) {
                    const entry = teamStats.find(
                        teamStat => teamStat.stat === stat,
                    );
                    if (entry) {
                        entry.rank = j + 1;
                        if (stat.startsWith("opp")) {
                            entry.rank = g.numTeams + 1 - entry.rank;
                        }
                    }
                    break;
                }
            }
        }

        return {
            att,
            rank,
            revenue,
            profit,
            teamStats,
        };
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
        const startersStats =
            process.env.SPORT === "basketball"
                ? ["gp", "min", "pts", "trb", "ast", "per"]
                : ["gp", "keyStats"];
        const leaderStats =
            process.env.SPORT === "basketball"
                ? ["pts", "trb", "ast"]
                : ["pssYds", "rusYds", "recYds"];

        let players = await idb.cache.players.indexGetAll("playersByTid", [
            PLAYER.FREE_AGENT,
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
                "watch",
            ],
            ratings: ["ovr", "pot", "dovr", "dpot", "skills", "pos"],
            stats: [...startersStats, ...leaderStats, "yearsWithTeam"],
            season: g.season,
            showNoStats: true,
            showRookies: true,
            fuzz: true,
        });

        // League leaders
        const leagueLeaders = [];
        for (const stat of leaderStats) {
            if (players.length > 0) {
                players.sort((a, b) => b.stats[stat] - a.stats[stat]);
                leagueLeaders.push({
                    abbrev: players[0].abbrev,
                    name: players[0].name,
                    pid: players[0].pid,
                    stat,
                    value: players[0].stats[stat],
                });
            } else {
                leagueLeaders.push({
                    abbrev: g.teamAbbrevsCache[g.userTid],
                    name: "",
                    pid: 0,
                    stat,
                    value: 0,
                });
            }
        }

        // Team leaders
        const userPlayers = players.filter(p => p.tid === g.userTid);
        const teamLeaders = [];
        for (const stat of leaderStats) {
            if (userPlayers.length > 0) {
                userPlayers.sort((a, b) => b.stats[stat] - a.stats[stat]);
                teamLeaders.push({
                    name: userPlayers[0].name,
                    pid: userPlayers[0].pid,
                    stat,
                    value: userPlayers[0].stats[stat],
                });
            } else {
                teamLeaders.push({
                    name: "",
                    pid: 0,
                    stat,
                    value: 0,
                });
            }
        }

        // Roster
        // Find starting 5 or top 5
        if (process.env.SPORT === "basketball") {
            userPlayers.sort((a, b) => a.rosterOrder - b.rosterOrder);
        } else {
            userPlayers.sort((a, b) => b.ratings.ovr - a.ratings.ovr);
        }
        const starters = userPlayers.slice(0, 5);

        return {
            leagueLeaders,
            teamLeaders,
            starters,
            startersStats,
        };
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
        let numGamesToWinSeries = 4;

        if (playoffSeries !== undefined) {
            const series = playoffSeries.series;
            await helpers.augmentSeries(series);

            // Find the latest playoff series with the user's team in it
            let found = false;
            for (let rnd = playoffSeries.currentRound; rnd >= 0; rnd--) {
                for (let i = 0; i < series[rnd].length; i++) {
                    if (
                        series[rnd][i].home.tid === g.userTid ||
                        (series[rnd][i].away &&
                            series[rnd][i].away.tid === g.userTid)
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
                        numGamesToWinSeries = helpers.numGamesToWinSeries(
                            g.numGamesPlayoffSeries[rnd],
                        );
                        break;
                    }
                }
                if (found) {
                    break;
                }
            }
        }

        return {
            numConfs: g.confs.length,
            numGamesToWinSeries,
            numPlayoffRounds: g.numGamesPlayoffSeries.length,
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

        const numPlayoffTeams =
            (2 ** g.numGamesPlayoffSeries.length - g.numPlayoffByes) / 2;

        const playoffsByConference = g.confs.length === 2;

        return {
            confTeams,
            numPlayoffTeams,
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
