/**
 * @name views.leagueDashboard
 * @namespace League dashboard, displaying several bits of information about the league/team.
 */
define(["db", "globals", "ui", "core/player", "core/season", "core/team", "lib/jquery", "lib/knockout", "lib/knockout.mapping", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (db, g, ui, player, season, team, $, ko, mapping, _, bbgmView, helpers, viewHelpers) {
    "use strict";

    function updateInbox(inputs, updateEvents) {
        var deferred, vars;

        deferred = $.Deferred();
        vars = {};

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0) {
            g.dbl.transaction("messages").objectStore("messages").getAll().onsuccess = function (event) {
                var i, messages;

                messages = event.target.result;
                messages.reverse();

                for (i = 0; i < messages.length; i++) {
                    delete messages[i].text;
                }
                messages = messages.slice(0, 2);

                vars = {
                    messages: messages
                };

                deferred.resolve(vars);
            };

            return deferred.promise();
        }
    }

    function updateTeam(inputs, updateEvents) {
        var deferred, vars;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.PRESEASON)) {
            deferred = $.Deferred();
            vars = {};

            g.dbl.transaction("teams").objectStore("teams").get(g.userTid).onsuccess = function (event) {
                var i, userTeam, userTeamSeason;

                userTeam = event.target.result;
                userTeamSeason = _.last(userTeam.seasons);

                vars.region = userTeam.region;
                vars.name = userTeam.name;
                vars.abbrev = userTeam.abbrev;
                vars.won = userTeamSeason.won;
                vars.lost = userTeamSeason.lost;
                vars.cash = userTeamSeason.cash / 1000;  // [millions of dollars]
                vars.salaryCap = g.salaryCap / 1000;  // [millions of dollars]
                vars.season = g.season;
                vars.playoffRoundsWon = userTeamSeason.playoffRoundsWon;

                vars.recentHistory = [];
                // 3 most recent years
                for (i = userTeam.seasons.length - 2; i > userTeam.seasons.length - 5 && i >= 0; i--) {
                    vars.recentHistory.push({
                        season: userTeam.seasons[i].season,
                        won: userTeam.seasons[i].won,
                        lost: userTeam.seasons[i].lost,
                        playoffRoundsWon: userTeam.seasons[i].playoffRoundsWon
                    });
                }

                deferred.resolve(vars);
            };
            return deferred.promise();
        }
    }

    function updatePayroll(inputs, updateEvents) {
        var deferred, vars;

        deferred = $.Deferred();
        vars = {};

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("playerMovement") >= 0) {
            db.getPayroll(null, g.userTid, function (payroll) {
                vars.payroll = payroll / 1000;  // [millions of dollars]

                deferred.resolve(vars);
            });
            return deferred.promise();
        }
    }


    function updateTeams(inputs, updateEvents) {
        var deferred, stats, vars;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.PRESEASON)) {
            deferred = $.Deferred();
            vars = {};

            stats = ["pts", "oppPts", "trb", "ast"];  // This is also used later to find ranks for these team stats
            team.filter({
                attrs: ["tid", "cid"],
                seasonAttrs: ["won", "lost", "winp", "att", "revenue", "profit"],
                stats: stats,
                season: g.season,
                sortBy: ["winp", "-lost", "won"]
            }, function (teams) {
                var cid, i, j, ranks;

                cid = _.find(teams, function (t) { return t.tid === g.userTid; }).cid;

                vars.rank = 1;
                for (i = 0; i < teams.length; i++) {
                    if (teams[i].cid === cid) {
                        if (teams[i].tid === g.userTid) {
                            vars.pts = teams[i].pts;
                            vars.oppPts = teams[i].oppPts;
                            vars.trb = teams[i].trb;
                            vars.ast = teams[i].ast;

                            vars.att = teams[i].att;
                            vars.revenue = teams[i].revenue;
                            vars.profit = teams[i].profit;
                            break;
                        } else {
                            vars.rank += 1;
                        }
                    }
                }

                for (i = 0; i < stats.length; i++) {
                    teams.sort(function (a, b) { return b[stats[i]] - a[stats[i]]; });
                    for (j = 0; j < teams.length; j++) {
                        if (teams[j].tid === g.userTid) {
                            vars[stats[i] + "Rank"] = j + 1;
                            break;
                        }
                    }
                }
                vars.oppPtsRank = 31 - vars.oppPtsRank;

                deferred.resolve(vars);
            });
            return deferred.promise();
        }
    }

    function updateGames(inputs, updateEvents) {
        var deferred, vars;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.PRESEASON)) {
            deferred = $.Deferred();
            vars = {};

            g.dbl.transaction("games").objectStore("games").index("season").getAll(g.season).onsuccess = function (event) {
                var games, i, overtime;

                games = event.target.result;
                games.reverse();  // Look through most recent games first

                vars.recentGames = [];
                for (i = 0; i < games.length; i++) {
                    if (games[i].overtimes === 1) {
                        overtime = " (OT)";
                    } else if (games[i].overtimes > 1) {
                        overtime = " (" + games[i].overtimes + "OT)";
                    } else {
                        overtime = "";
                    }

                    // Check tid
                    if (games[i].teams[0].tid === g.userTid) {
                        vars.recentGames.push({
                            gid: games[i].gid,
                            home: true,
                            pts: games[i].teams[0].pts,
                            oppPts: games[i].teams[1].pts,
                            oppAbbrev: helpers.getAbbrev(games[i].teams[1].tid),
                            won: games[i].teams[0].pts > games[i].teams[1].pts,
                            overtime: overtime
                        });
                    } else if (games[i].teams[1].tid === g.userTid) {
                        vars.recentGames.push({
                            gid: games[i].gid,
                            home: false,
                            pts: games[i].teams[1].pts,
                            oppPts: games[i].teams[0].pts,
                            oppAbbrev: helpers.getAbbrev(games[i].teams[0].tid),
                            won: games[i].teams[1].pts > games[i].teams[0].pts,
                            overtime: overtime
                        });
                    }

                    if (vars.recentGames.length === 3) {
                        break;
                    }
                }

                deferred.resolve(vars);
            };
            return deferred.promise();
        }
    }

    function updateSchedule(inputs, updateEvents) {
        var deferred, vars;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.PRESEASON)) {
            deferred = $.Deferred();
            vars = {};

            season.getSchedule(null, 0, function (schedule) {
                var i;

                vars.nextGameAbbrev = "";
                vars.nextGameHome = false;
                for (i = 0; i < schedule.length; i++) {
                    if (schedule[i].homeTid === g.userTid) {
                        vars.nextGameAbbrev = g.teamAbbrevsCache[schedule[i].awayTid];
                        vars.nextGameHome = true;
                        break;
                    } else if (schedule[i].awayTid === g.userTid) {
                        vars.nextGameAbbrev = g.teamAbbrevsCache[schedule[i].homeTid];
                        break;
                    }
                }
                deferred.resolve(vars);
            });
            return deferred.promise();
        }
    }

    function updatePlayers(inputs, updateEvents) {
        var deferred, vars;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.PRESEASON)) {
            deferred = $.Deferred();
            vars = {};

            g.dbl.transaction("players").objectStore("players").index("tid").getAll(IDBKeyRange.lowerBound(g.PLAYER.RETIRED, true)).onsuccess = function (event) {
                var i, players, stats, userPlayers;

                players = player.filter(event.target.result, {
                    attrs: ["pid", "name", "abbrev", "tid", "age", "contract", "rosterOrder", "injury", "watch", "pos", "yearsWithTeam"],
                    ratings: ["ovr", "pot", "dovr", "dpot", "skills"],
                    stats: ["gp", "min", "pts", "trb", "ast", "per"],
                    season: g.season,
                    showNoStats: true,
                    showRookies: true,
                    fuzz: true
                });

                // League leaders
                vars.leagueLeaders = {};
                stats = ["pts", "trb", "ast"]; // Categories for leaders
                for (i = 0; i < stats.length; i++) {
                    players.sort(function (a, b) { return b.stats[stats[i]] - a.stats[stats[i]]; });
                    vars.leagueLeaders[stats[i]] = {
                        pid: players[0].pid,
                        name: players[0].name,
                        abbrev: players[0].abbrev,
                        stat: players[0].stats[stats[i]]
                    };
                }

                // Team leaders
                userPlayers = _.filter(players, function (p) { return p.tid === g.userTid; });
                vars.teamLeaders = {};
                for (i = 0; i < stats.length; i++) {
                    if (userPlayers.length > 0) {
                        userPlayers.sort(function (a, b) { return b.stats[stats[i]] - a.stats[stats[i]]; });
                        vars.teamLeaders[stats[i]] = {
                            pid: userPlayers[0].pid,
                            name: userPlayers[0].name,
                            stat: userPlayers[0].stats[stats[i]]
                        };
                    } else {
                        vars.teamLeaders[stats[i]] = {
                            pid: 0,
                            name: "",
                            stat: 0
                        };
                    }
                }

                // Roster
                // Find starting 5
                vars.starters = userPlayers.sort(function (a, b) { return a.rosterOrder - b.rosterOrder; }).splice(5);

                deferred.resolve(vars);
            };
            return deferred.promise();
        }
    }

    function updatePlayoffs(inputs, updateEvents) {
        var deferred, vars;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || (g.phase >= g.PHASE.PLAYOFFS && updateEvents.indexOf("gameSim") >= 0) || (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.PLAYOFFS)) {
            deferred = $.Deferred();
            vars = {
                showPlayoffSeries: false
            };

            g.dbl.transaction("playoffSeries").objectStore("playoffSeries").get(g.season).onsuccess = function (event) {
                var found, i, playoffSeries, rnd, series;

                playoffSeries = event.target.result;
                if (playoffSeries !== undefined) {
                    series = playoffSeries.series;
                    found = false;
                    // Find the latest playoff series with the user's team in it
                    for (rnd = playoffSeries.currentRound; rnd >= 0; rnd--) {
                        for (i = 0; i < series[rnd].length; i++) {
                            if (series[rnd][i].home.tid === g.userTid || series[rnd][i].away.tid === g.userTid) {
                                vars.series = [[series[rnd][i]]];
                                found = true;
                                vars.showPlayoffSeries = true;
                                if (rnd === 0) {
                                    vars.seriesTitle = "First Round";
                                } else if (rnd === 1) {
                                    vars.seriesTitle = "Second Round";
                                } else if (rnd === 2) {
                                    vars.seriesTitle = "Conference Finals";
                                } else if (rnd === 3) {
                                    vars.seriesTitle = "League Finals";
                                }
                                break;
                            }
                        }
                        if (found) {
                            break;
                        }
                    }
                }

                deferred.resolve(vars);
            };
            return deferred.promise();
        }
    }

    function updateStandings(inputs, updateEvents, vm) {
        var deferred;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0) {
            deferred = $.Deferred();

            team.filter({
                attrs: ["tid", "cid", "abbrev", "region"],
                seasonAttrs: ["won", "lost"],
                season: g.season,
                sortBy: ["winp", "-lost", "won"]
            }, function (teams) {
                var cid, confTeams, i, k, l;

                // Find user's conference
                for (i = 0; i < teams.length; i++) {
                    if (teams[i].tid === g.userTid) {
                        cid = teams[i].cid;
                        break;
                    }
                }

                confTeams = [];
                l = 0;
                for (k = 0; k < teams.length; k++) {
                    if (cid === teams[k].cid) {
                        confTeams.push(helpers.deepCopy(teams[k]));
                        confTeams[l].rank = l + 1;
                        if (l === 0) {
                            confTeams[l].gb = 0;
                        } else {
                            confTeams[l].gb = helpers.gb(confTeams[0], confTeams[l]);
                        }
                        l += 1;
                    }
                }

                deferred.resolve({
                    confTeams: confTeams
                });
            });
            return deferred.promise();
        }
    }

    function uiFirst() {
        ui.title("Dashboard");
    }

    return bbgmView.init({
        id: "leagueDashboard",
        runBefore: [updateInbox, updateTeam, updatePayroll, updateTeams, updateGames, updateSchedule, updatePlayers, updatePlayoffs, updateStandings],
        uiFirst: uiFirst
    });
});