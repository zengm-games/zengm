/**
 * @name views.leagueDashboard
 * @namespace League dashboard, displaying several bits of information about the league/team.
 */
define(["db", "globals", "ui", "core/season", "lib/knockout", "lib/knockout.mapping", "lib/underscore", "util/helpers", "util/viewHelpers"], function (db, g, ui, season, ko, mapping, _, helpers, viewHelpers) {
    "use strict";

    var vm;

    function display(cb) {
        var leagueContentEl;

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "leagueDashboard") {
            ui.update({
                container: "league_content",
                template: "leagueDashboard"
            });
            ko.applyBindings(vm, leagueContentEl);
            ui.title("Dashboard");
        }

        cb();
    }

    function loadBefore(updateEvents, cb) {
        var tx, vars;

        vars = {};
        vars.season = g.season;

        tx = g.dbl.transaction(["games", "players", "playoffSeries", "releasedPlayers", "schedule", "teams"]);

        tx.objectStore("teams").get(g.userTid).onsuccess = function (event) {
            var extraText, i, userTeam, userTeamSeason;

            userTeam = event.target.result;
            userTeamSeason = _.last(userTeam.seasons);

            vars.region = userTeam.region;
            vars.name = userTeam.name;
            vars.abbrev = userTeam.abbrev;
            vars.won = userTeamSeason.won;
            vars.lost = userTeamSeason.lost;
            vars.cash = userTeamSeason.cash / 1000;  // [millions of dollars]

            vars.recentHistory = [];
            // 3 most recent years
            for (i = userTeam.seasons.length - 2; i > userTeam.seasons.length - 5 && i >= 0; i--) {
                extraText = "";
                if (userTeam.seasons[i].playoffRoundsWon === 4) {
                    extraText = "league champs";
                } else if (userTeam.seasons[i].playoffRoundsWon === 3) {
                    extraText = "conference champs";
                } else if (userTeam.seasons[i].playoffRoundsWon === 2) {
                    extraText = "made conference finals";
                } else if (userTeam.seasons[i].playoffRoundsWon === 1) {
                    extraText = "made second round";
                } else if (userTeam.seasons[i].playoffRoundsWon === 0) {
                    extraText = "made playoffs";
                }

                vars.recentHistory.push({
                    season: userTeam.seasons[i].season,
                    won: userTeam.seasons[i].won,
                    lost: userTeam.seasons[i].lost,
                    extraText: extraText
                });
            }

            db.getPayroll(tx, g.userTid, function (payroll) {
                var attributes, seasonAttributes, stats;

                vars.payroll = payroll / 1000;  // [millions of dollars]

                attributes = ["tid", "cid"];
                stats = ["pts", "oppPts", "trb", "ast"];  // This is also used later to find ranks for these team stats
                seasonAttributes = ["won", "lost", "winp", "streakLong", "att", "revenue", "profit"];
                db.getTeams(tx, g.season, attributes, stats, seasonAttributes, {sortBy: "winp"}, function (teams) {
                    var i, j, ranks;

                    vars.rank = 1;
                    for (i = 0; i < teams.length; i++) {
                        if (teams[i].cid === userTeam.cid) {
                            if (teams[i].tid === g.userTid) {
                                vars.pts = teams[i].pts;
                                vars.oppPts = teams[i].oppPts;
                                vars.trb = teams[i].trb;
                                vars.ast = teams[i].ast;

                                vars.streakLong = teams[i].streakLong;
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

                    tx.objectStore("games").index("season").getAll(g.season).onsuccess = function (event) {
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

                        season.getSchedule(tx, 0, function (schedule) {
                            var i;

                            vars.nextGameAbbrev = "";
                            vars.nextGameHome = false;
                            for (i = 0; i < schedule.length; i++) {
                                if (schedule[i].homeTid === g.userTid) {
                                    vars.nextGameAbbrev = schedule[i].awayAbbrev;
                                    vars.nextGameHome = true;
                                    break;
                                } else if (schedule[i].awayTid === g.userTid) {
                                    vars.nextGameAbbrev = schedule[i].homeAbbrev;
                                    break;
                                }
                            }

                            tx.objectStore("players").index("tid").getAll(IDBKeyRange.lowerBound(g.PLAYER.RETIRED, true)).onsuccess = function (event) {
                                var attributes, i, freeAgents, leagueLeaders, players, ratings, stats, userPlayers;

                                attributes = ["pid", "name", "abbrev", "tid", "age", "contract", "rosterOrder"];
                                ratings = ["ovr", "pot"];
                                stats = ["pts", "trb", "ast"];  // This is also used later to find team/league leaders for these player stats
                                players = db.getPlayers(event.target.result, g.season, null, attributes, stats, ratings, {showNoStats: true, fuzz: true});

                                // League leaders
                                vars.leagueLeaders = {};
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
                                    userPlayers.sort(function (a, b) { return b.stats[stats[i]] - a.stats[stats[i]]; });
                                    vars.teamLeaders[stats[i]] = {
                                        pid: userPlayers[0].pid,
                                        name: userPlayers[0].name,
                                        stat: userPlayers[0].stats[stats[i]]
                                    };
                                }

                                // Expiring contracts
                                userPlayers.sort(function (a, b) {  return a.rosterOrder - b.rosterOrder; });
                                vars.expiring = [];
                                for (i = 0; i < userPlayers.length; i++) {
                                    // Show contracts expiring this year, or next year if we're already in free agency
                                    if (userPlayers[i].contract.exp === g.season || (g.phase >= g.PHASE.RESIGN_PLAYERS && userPlayers[i].contract.exp === g.season + 1)) {
                                        vars.expiring.push({
                                            pid: userPlayers[i].pid,
                                            name: userPlayers[i].name,
                                            age: userPlayers[i].age,
                                            pts: userPlayers[i].stats.pts,
                                            contractAmount: userPlayers[i].contract.amount,
                                            ovr: userPlayers[i].ratings.ovr,
                                            pot: userPlayers[i].ratings.pot
                                        });
                                    }
                                }

                                // Free agents
                                freeAgents = _.filter(players, function (p) { return p.tid === g.PLAYER.FREE_AGENT; });
                                freeAgents.sort(function (a, b) {  return (b.ratings.ovr + b.ratings.pot) - (a.ratings.ovr + a.ratings.pot); });
                                vars.freeAgents = [];
                                if (freeAgents.length > 0) {
                                    i = 0;
                                    while (true) {
                                        vars.freeAgents.push({
                                            pid: freeAgents[i].pid,
                                            name: freeAgents[i].name,
                                            age: freeAgents[i].age,
                                            ovr: freeAgents[i].ratings.ovr,
                                            pot: freeAgents[i].ratings.pot
                                        });

                                        i += 1;
                                        if (i === 3 || i === freeAgents.length) {
                                            break;
                                        }
                                    }
                                }
                                vars.numRosterSpots = 15 - userPlayers.length;

                                tx.objectStore("playoffSeries").get(g.season).onsuccess = function (event) {
                                    var data, found, i, playoffSeries, rnd, series;

                                    playoffSeries = event.target.result;
                                    vars.showPlayoffSeries = false;
                                    vars.playoffsStarted = g.phase >= g.PHASE.PLAYOFFS;
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

                                    mapping.fromJS(vars, {}, vm);

console.log(vars);
console.log(vm);
                                    cb();
                                };
                            };
                        });
                    };
                });
            });
        };
    }

    function update(updateEvents, cb) {
        var leagueContentEl;

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "leagueDashboard") {
            ko.cleanNode(leagueContentEl);
            vm = {
                salaryCap: ko.observable(g.salaryCap / 1000)  // [millions of dollars]
            };
        }

        loadBefore(updateEvents, function () {
            display(cb);
        });
    }

    function get(req) {
        viewHelpers.beforeLeague(req, function (updateEvents, cb) {
            update(updateEvents, cb);
        });
    }

    return {
        update: update,
        get: get
    };
});