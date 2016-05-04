var g = require('../globals');
var ui = require('../ui');
var player = require('../core/player');
var season = require('../core/season');
var team = require('../core/team');
var backboard = require('backboard');
var Promise = require('bluebird');
var ko = require('knockout');
var komapping = require('knockout.mapping');
var _ = require('underscore');
var bbgmView = require('../util/bbgmView');
var helpers = require('../util/helpers');

function InitViewModel() {
    this.completed = ko.observableArray([]);
    this.upcoming = ko.observableArray([]);
}

function updateInbox(inputs, updateEvents) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0) {
        return g.dbl.messages.getAll().then(function (messages) {
            var i;

            messages.reverse();

            for (i = 0; i < messages.length; i++) {
                delete messages[i].text;
            }
            messages = messages.slice(0, 2);

            return {
                messages: messages
            };
        });
    }
}

function updateTeam(inputs, updateEvents) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || updateEvents.indexOf("newPhase") >= 0) {
        return Promise.all([
            g.dbl.teams.get(g.userTid),
            g.dbl.teamSeasons.index("season, tid").get([g.season, g.userTid])
        ]).spread(function (t, latestSeason) {
            return {
                region: t.region,
                name: t.name,
                abbrev: t.abbrev,
                won: latestSeason.won,
                lost: latestSeason.lost,
                cash: latestSeason.cash / 1000,  // [millions of dollars]
                salaryCap: g.salaryCap / 1000,  // [millions of dollars]
                season: g.season,
                playoffRoundsWon: latestSeason.playoffRoundsWon
            };
        });
    }
}

function updatePayroll(inputs, updateEvents) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("playerMovement") >= 0) {
        return team.getPayroll(null, g.userTid).get(0).then(function (payroll) {
            return {
                payroll: payroll / 1000 // [millions of dollars]
            };
        });
    }
}


function updateTeams(inputs, updateEvents) {
    var stats, vars;

    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || updateEvents.indexOf("newPhase") >= 0) {
        vars = {};
        stats = ["pts", "oppPts", "trb", "ast"];  // This is also used later to find ranks for these team stats

        return team.filter({
            attrs: ["tid", "cid"],
            seasonAttrs: ["won", "lost", "winp", "att", "revenue", "profit"],
            stats: stats,
            season: g.season,
            sortBy: ["winp", "-lost", "won"]
        }).then(function (teams) {
            var cid, i, j;

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

            return vars;
        });
    }
}

function updateGames(inputs, updateEvents, vm) {
    var completed, numShowCompleted;

    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("newPhase") >= 0) {
        numShowCompleted = 4;
        completed = [];

        // This could be made much faster by using a compound index to search for season + team, but that's not supported by IE 10
        return g.dbl.games.index('season').iterate(g.season, "prev", function (game, shortCircuit) {
            var i, overtime;

            if (completed.length >= numShowCompleted) {
                return shortCircuit();
            }

            if (game.overtimes === 1) {
                overtime = " (OT)";
            } else if (game.overtimes > 1) {
                overtime = " (" + game.overtimes + "OT)";
            } else {
                overtime = "";
            }

            // Check tid
            if (game.teams[0].tid === g.userTid || game.teams[1].tid === g.userTid) {
                completed.push({
                    gid: game.gid,
                    overtime: overtime
                });

                i = completed.length - 1;
                if (game.teams[0].tid === g.userTid) {
                    completed[i].home = true;
                    completed[i].pts = game.teams[0].pts;
                    completed[i].oppPts = game.teams[1].pts;
                    completed[i].oppTid = game.teams[1].tid;
                    completed[i].oppAbbrev = g.teamAbbrevsCache[game.teams[1].tid];
                    completed[i].won = game.teams[0].pts > game.teams[1].pts;
                } else if (game.teams[1].tid === g.userTid) {
                    completed[i].home = false;
                    completed[i].pts = game.teams[1].pts;
                    completed[i].oppPts = game.teams[0].pts;
                    completed[i].oppTid = game.teams[0].tid;
                    completed[i].oppAbbrev = g.teamAbbrevsCache[game.teams[0].tid];
                    completed[i].won = game.teams[1].pts > game.teams[0].pts;
                }

                completed[i] = helpers.formatCompletedGame(completed[i]);
            }
        }).then(function () {
            vm.completed(completed);
        });
    }
}

function updateSchedule(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("newPhase") >= 0) {
        return season.getSchedule().then(function (schedule_) {
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
        });
    }
}

function updatePlayers(inputs, updateEvents) {
    var vars;

    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || updateEvents.indexOf("newPhase") >= 0) {
        vars = {};

        return g.dbl.tx(["players", "playerStats"], function (tx) {
            return tx.players.index('tid').getAll(backboard.lowerBound(g.PLAYER.UNDRAFTED)).then(function (players) {
                return player.withStats(tx, players, {statsSeasons: [g.season]});
            }).then(function (players) {
                var i, stats, userPlayers;

                players = player.filter(players, {
                    attrs: ["pid", "name", "abbrev", "tid", "age", "contract", "rosterOrder", "injury", "watch"],
                    ratings: ["ovr", "pot", "dovr", "dpot", "skills", "pos"],
                    stats: ["gp", "min", "pts", "trb", "ast", "per", "yearsWithTeam"],
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

                return vars;
            });
        });
    }
}

function updatePlayoffs(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || (g.phase >= g.PHASE.PLAYOFFS && updateEvents.indexOf("gameSim") >= 0) || (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.PLAYOFFS)) {
        return g.dbl.playoffSeries.get(g.season).then(function (playoffSeries) {
            var found, i, rnd, series, vars;

            vars = {
                showPlayoffSeries: false
            };

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

                            // Update here rather than by returning vars because returning vars doesn't guarantee order of updates, so it can cause an error when showPlayoffSeries is true before the other stuff is set (try it with the same league in two tabs). But otherwise (for normal page loads), this isn't sufficient and we need to return vars. I don't understand, but it works.
                            if (updateEvents.indexOf("dbChange") >= 0) {
                                komapping.fromJS({series: vars.series, seriesTitle: vars.seriesTitle}, vm);
                            }
                            break;
                        }
                    }
                    if (found) {
                        break;
                    }
                }
            }

            return vars;
        });
    }
}

function updateStandings(inputs, updateEvents) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0) {
        return team.filter({
            attrs: ["tid", "cid", "abbrev", "region"],
            seasonAttrs: ["won", "lost", "winp"],
            season: g.season,
            sortBy: ["winp", "-lost", "won"]
        }).then(function (teams) {
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

            return {
                confTeams: confTeams
            };
        });
    }
}

function uiFirst() {
    ui.title("Dashboard");
}

module.exports = bbgmView.init({
    id: "leagueDashboard",
    InitViewModel,
    runBefore: [updateInbox, updateTeam, updatePayroll, updateTeams, updateGames, updateSchedule, updatePlayers, updatePlayoffs, updateStandings],
    uiFirst
});
