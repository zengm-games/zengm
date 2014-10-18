/**
 * @name views.leagueDashboard
 * @namespace League dashboard, displaying several bits of information about the league/team.
 */
define(["dao", "db", "globals", "ui", "core/player", "core/season", "core/team", "lib/jquery", "lib/knockout", "lib/knockout.mapping", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (dao, db, g, ui, player, season, team, $, ko, mapping, _, bbgmView, helpers, viewHelpers) {
    "use strict";

    function InitViewModel() {
        this.completed = ko.observableArray([]);
        this.upcoming = ko.observableArray([]);
    }

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

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || updateEvents.indexOf("newPhase") >= 0) {
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

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || updateEvents.indexOf("newPhase") >= 0) {
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

    function updateGames(inputs, updateEvents, vm) {
        var deferred, numShowCompleted, vars;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("newPhase") >= 0) {
            deferred = $.Deferred();
            vars = {};

            numShowCompleted = 4;
            vars.completed = [];
            // This could be made much faster by using a compound index to search for season + team, but that's not supported by IE 10
            g.dbl.transaction("games").objectStore("games").index("season").openCursor(g.season, "prev").onsuccess = function (event) {
                var cursor, game, i, overtime;

                cursor = event.target.result;
                if (cursor && vars.completed.length < numShowCompleted) {
                    game = cursor.value;

                    if (game.overtimes === 1) {
                        overtime = " (OT)";
                    } else if (game.overtimes > 1) {
                        overtime = " (" + game.overtimes + "OT)";
                    } else {
                        overtime = "";
                    }

                    // Check tid
                    if (game.teams[0].tid === g.userTid || game.teams[1].tid === g.userTid) {
                        vars.completed.push({
                            gid: game.gid,
                            overtime: overtime
                        });

                        i = vars.completed.length - 1;
                        if (game.teams[0].tid === g.userTid) {
                            vars.completed[i].home = true;
                            vars.completed[i].pts = game.teams[0].pts;
                            vars.completed[i].oppPts = game.teams[1].pts;
                            vars.completed[i].oppTid = game.teams[1].tid;
                            vars.completed[i].oppAbbrev = g.teamAbbrevsCache[game.teams[1].tid];
                            vars.completed[i].won = game.teams[0].pts > game.teams[1].pts;
                        } else if (game.teams[1].tid === g.userTid) {
                            vars.completed[i].home = false;
                            vars.completed[i].pts = game.teams[1].pts;
                            vars.completed[i].oppPts = game.teams[0].pts;
                            vars.completed[i].oppTid = game.teams[0].tid;
                            vars.completed[i].oppAbbrev = g.teamAbbrevsCache[game.teams[0].tid];
                            vars.completed[i].won = game.teams[1].pts > game.teams[0].pts;
                        }

                        vars.completed[i] = helpers.formatCompletedGame(vars.completed[i]);
                    }

                    cursor.continue();
                } else {
                    vm.completed(vars.completed);
                    deferred.resolve();
                }
            };
            return deferred.promise();
        }
    }

    function updateSchedule(inputs, updateEvents, vm) {
        var deferred, vars;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("newPhase") >= 0) {
            deferred = $.Deferred();
            vars = {};

            season.getSchedule(null, 0, function (schedule_) {
                var game, games, i, numShowUpcoming, row, team0, team1;

                games = [];
                numShowUpcoming = 3;
                for (i = 0; i < schedule_.length; i++) {
                    game = schedule_[i];
                    if (g.userTid === game.homeTid || g.userTid === game.awayTid) {
                        team0 = {tid: game.homeTid, abbrev: g.teamAbbrevsCache[game.homeTid], region: g.teamRegionsCache[game.homeTid], name: g.teamNamesCache[game.homeTid]};
                        team1 = {tid: game.awayTid, abbrev: g.teamAbbrevsCache[game.awayTid], region: g.teamRegionsCache[game.awayTid], name: g.teamNamesCache[game.awayTid]};
                        if (g.userTid === game.homeTid) {
                            row = {teams: [team1, team0], vsat: "at"};
                        } else {
                            row = {teams: [team1, team0], vsat: "at"};
                        }
                        games.push(row);
                    }

                    if (games.length >= numShowUpcoming) {
                        break;
                    }
                }
                vm.upcoming(games);
                deferred.resolve();
            });

            return deferred.promise();
        }
    }

    function updatePlayers(inputs, updateEvents) {
        var deferred, vars;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || updateEvents.indexOf("newPhase") >= 0) {
            deferred = $.Deferred();
            vars = {};

            // Needs all seasons because of YWT!
            dao.players.getAll({
                index: "tid",
                key: IDBKeyRange.lowerBound(g.PLAYER.UNDRAFTED)
            }, function (players) {
                var i, stats, userPlayers;

                players = player.filter(players, {
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
                vars.starters = userPlayers.sort(function (a, b) { return a.rosterOrder - b.rosterOrder; }).slice(0, 5);

                deferred.resolve(vars);
            });
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
                seasonAttrs: ["won", "lost", "winp"],
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
                        if (confTeams[l].tid === g.userTid) {
                            confTeams[l].highlight = true;
                        } else {
                            confTeams[l].highlight = false;
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
        InitViewModel: InitViewModel,
        runBefore: [updateInbox, updateTeam, updatePayroll, updateTeams, updateGames, updateSchedule, updatePlayers, updatePlayoffs, updateStandings],
        uiFirst: uiFirst
    });
});