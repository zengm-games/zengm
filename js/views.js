define(["db", "ui", "core/contractNegotiation", "core/game", "core/league", "core/season", "core/trade", "util/helpers"], function (db, ui, contractNegotiation, game, league, season, trade, helpers) {
    "use strict";

    function beforeLeague(req, cb) {
        var leagueMenu;

        g.lid = parseInt(req.params.lid, 10);
        helpers.loadGameAttributes();

        // Make sure league exists


        // Make sure league template FOR THE CURRENT LEAGUE is showing
        leagueMenu = document.getElementById("league_menu");
        if (leagueMenu === null || parseInt(leagueMenu.dataset.lid, 10) !== g.lid) {
            // Connect to league database
            db.connectLeague(g.lid, function () {
                var data;

                data = {
                    container: "content",
                    template: "leagueLayout",
                    vars: {}
                };
                ui.update(data);

                // Update play menu
                ui.updateStatus();
                ui.updatePhase();
                ui.updatePlayMenu();

                cb();
            });
        } else {
            cb();
        }
    }

    function beforeNonLeague() {
        document.getElementById("playButton").innerHTML = "";
        document.getElementById("playPhase").innerHTML = "";
        document.getElementById("playStatus").innerHTML = "";
    }

    function init_db(req) {
        beforeNonLeague();

        // Delete any current league databases
        console.log("Deleting any current league databases...");
        g.dbm.transaction(["leagues"]).objectStore("leagues").getAll().onsuccess = function (event) {
            var data, done, i, leagues, request;

            leagues = event.target.result;

            done = 0;
            for (i = 0; i < leagues.length; i++) {
                league.remove(i, function () {
                    done += 1;
                    if (done === leagues.length) {
                        // Delete any current meta database
                        console.log("Deleting any current meta database...");
                        g.dbm.close();
                        request = g.indexedDB.deleteDatabase("meta");
                        request.onsuccess = function (event) {
                            // Create new meta database
                            console.log("Creating new meta database...");
                            db.connectMeta(function () {
                                console.log("Done!");
                            });
                        };
                    }
                });
            }
        };
    }

    function dashboard(req) {
        beforeNonLeague();

        g.dbm.transaction(["leagues"]).objectStore("leagues").getAll().onsuccess = function (event) {
            var data, i, leagues, teams;

            leagues = event.target.result;
            teams = helpers.getTeams();

            for (i = 0; i < leagues.length; i++) {
                leagues[i].region = teams[leagues[i].tid].region;
                leagues[i].name = teams[leagues[i].tid].name;
                leagues[i].phaseText = JSON.parse(localStorage.getItem("league" + leagues[i].lid + "GameAttributes")).pmPhase;
                delete leagues[i].tid;
            }

            data = {
                container: "content",
                template: "dashboard",
                title: "Dashboard",
                vars: {leagues: leagues}
            };
            ui.update(data);
        };
    }

    function newLeague(req) {
        var tid;

        beforeNonLeague();

        if (req.method === "get") {
            g.dbm.transaction(["teams"]).objectStore("teams").getAll().onsuccess = function (event) {
                var data, teams;

                teams = event.target.result;

                data = {
                    container: "content",
                    template: "newLeague",
                    title: "Create New League",
                    vars: {teams: teams}
                };
                ui.update(data);
            };
        } else if (req.method === "post") {
            tid = parseInt(req.params.tid, 10);
            if (tid >= 0 && tid <= 29) {
                league.create(tid, req.params.players, function () {
                    Davis.location.assign(new Davis.Request("/l/" + g.lid));
                });
            }
        }
    }

    function deleteLeague(req) {
        var lid;

        lid = parseInt(req.params.lid, 10);

        if (!req.params.confirm) {
            db.connectLeague(lid, function () {
                var transaction;

                transaction = g.dbl.transaction(["games", "players", "teams"]);
                transaction.objectStore("games").count().onsuccess = function (event) {
                    var numGames;

                    numGames = event.target.result;

                    transaction.objectStore("teams").get(0).onsuccess = function (event) {
                        var numSeasons;

                        numSeasons = event.target.result.seasons.length;

                        transaction.objectStore("players").count().onsuccess = function (event) {
                            var data, numPlayers;

                            numPlayers = event.target.result;

                            g.lid = lid;  // Injected into the template by ui.update
                            data = {
                                container: "content",
                                template: "deleteLeague",
                                title: "Dashboard",
                                vars: {numGames: numGames, numPlayers: numPlayers, numSeasons: numSeasons}
                            };
                            ui.update(data, req.raw.cb);
                        };
                    };
                };
            });
        } else {
            league.remove(lid, function () {
                req.redirect("/");
            });
        }
    }

    function leagueDashboard(req) {
        beforeLeague(req, function () {
            var transaction, vars;

            vars = {};
            vars.season = g.season;
            vars.salaryCap = g.salaryCap / 1000;

            transaction = g.dbl.transaction(["games", "players", "playoffSeries", "releasedPlayers", "schedule", "teams"]);

            transaction.objectStore("teams").get(g.userTid).onsuccess = function (event) {
                var extraText, i, userTeam, userTeamSeason;

                userTeam = event.target.result;
                userTeamSeason = _.last(userTeam.seasons);

                vars.region = userTeam.region;
                vars.name = userTeam.name;
                vars.abbrev = userTeam.abbrev;
                vars.won = userTeamSeason.won;
                vars.lost = userTeamSeason.lost;
                vars.cash = userTeamSeason.cash / 1000000;

                vars.recentHistory = [];
                // 3 most recent years
                for (i = userTeam.seasons.length - 2; i > userTeam.seasons.length - 5 && i >= 0; i--) {
                    extraText = "";
                    if (userTeam.seasons[i].leagueChamps) {
                        extraText = "league champs";
                    } else if (userTeam.seasons[i].confChamps) {
                        extraText = "conference champs";
                    } else if (userTeam.seasons[i].madePlayoffs) {
                        extraText = "made playoffs";
                    }

                    vars.recentHistory.push({
                        season: userTeam.seasons[i].season,
                        won: userTeam.seasons[i].won,
                        lost: userTeam.seasons[i].lost,
                        extraText: extraText
                    });
                }

                db.getPayroll(transaction, g.userTid, function (payroll) {
                    var attributes, seasonAttributes, stats;

                    vars.payroll = payroll / 1000;

                    attributes = ["tid", "cid"];
                    stats = ["pts", "oppPts", "trb", "ast"];  // This is also used later to find ranks for these team stats
                    seasonAttributes = ["won", "lost", "winp", "streakLong", "att", "revenue", "profit"];
                    db.getTeams(transaction, g.season, attributes, stats, seasonAttributes, "winp", function (teams) {
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
                            teams.sort(function (a, b) {  return b[stats[i]] - a[stats[i]]; });
                            for (j = 0; j < teams.length; j++) {
                                if (teams[j].tid === g.userTid) {
                                    vars[stats[i] + "Rank"] = j + 1;
                                    break;
                                }
                            }
                        }
                        vars.oppPtsRank = 30 - vars.oppPtsRank;

                        transaction.objectStore("games").index("season").getAll(g.season).onsuccess = function (event) {
                            var game, games, i, tidMatch;

                            games = event.target.result;
                            games.reverse();  // Look through most recent games first

                            vars.recentGames = [];
                            for (i = 0; i < games.length; i++) {
                                // Check tid
                                tidMatch = false;
                                if (games[i].teams[0].tid === g.userTid) {
                                    tidMatch = true;
                                    game = {
                                        gid: games[i].gid,
                                        home: true,
                                        pts: games[i].teams[0].pts,
                                        oppPts: games[i].teams[1].pts,
                                        oppAbbrev: helpers.getAbbrev(games[i].teams[1].tid)
                                    };
                                } else if (games[i].teams[1].tid === g.userTid) {
                                    tidMatch = true;
                                    game = {
                                        gid: games[i].gid,
                                        home: false,
                                        pts: games[i].teams[1].pts,
                                        oppPts: games[i].teams[0].pts,
                                        oppAbbrev: helpers.getAbbrev(games[i].teams[0].tid)
                                    };
                                }

                                if (tidMatch) {
                                    if (game.pts > game.oppPts) {
                                        game.won = true;
                                    } else {
                                        game.won = false;
                                    }
                                    vars.recentGames.push(game);
                                }

                                if (vars.recentGames.length === 3) {
                                    break;
                                }
                            }

                            season.getSchedule(transaction, 0, function (schedule) {
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


                                var data;

                                data = {
                                    container: "league_content",
                                    template: "leagueDashboard",
                                    title: "Dashboard",
                                    vars: vars
                                };
                                ui.update(data, req.raw.cb);
                            });
                        };
                    });
                });
            };
        });
    }

    function standings(req) {
        beforeLeague(req, function () {
            var attributes, gb, season, seasonAttributes, seasons;

            season = helpers.validateSeason(req.params.season);
            seasons = helpers.getSeasons(season);

            // Calculate the number of games that team is behind team0
            gb = function (team0, team) {
                return ((team0.won - team0.lost) - (team.won - team.lost)) / 2;
            };

            attributes = ["tid", "cid", "did", "abbrev", "region", "name"];
            seasonAttributes = ["won", "lost", "winp", "wonHome", "lostHome", "wonAway", "lostAway", "wonDiv", "lostDiv", "wonConf", "lostConf", "lastTen", "streak"];
            db.getTeams(null, season, attributes, [], seasonAttributes, "winp", function (teams) {
                var confs, confTeams, data, divTeams, i, j, k, l, lastTenLost, lastTenWon;

                confs = [];
                for (i = 0; i < g.confs.length; i++) {
                    confTeams = [];
                    l = 0;
                    for (k = 0; k < teams.length; k++) {
                        if (g.confs[i].cid === teams[k].cid) {
                            confTeams.push(helpers.deepCopy(teams[k]));
                            confTeams[l].rank = l + 1;
                            if (l === 0) {
                                confTeams[l].gb = 0;
                            } else {
                                confTeams[l].gb = gb(confTeams[0], confTeams[l]);
                            }
                            l += 1;
                        }
                    }
                    confTeams[7].separator = true;

                    confs.push({name: g.confs[i].name, divs: [], teams: confTeams});

                    for (j = 0; j < g.divs.length; j++) {
                        if (g.divs[j].cid === g.confs[i].cid) {
                            divTeams = [];
                            l = 0;
                            for (k = 0; k < teams.length; k++) {
                                if (g.divs[j].did === teams[k].did) {
                                    divTeams.push(helpers.deepCopy(teams[k]));
                                    if (l === 0) {
                                        divTeams[l].gb = 0;
                                    } else {
                                        divTeams[l].gb = gb(divTeams[0], divTeams[l]);
                                    }
                                    l += 1;
                                }
                            }

                            confs[i].divs.push({name: g.divs[j].name, teams: divTeams});
                        }
                    }
                }

                data = {
                    container: "league_content",
                    template: "standings",
                    title: "Standings - " + season,
                    vars: {confs: confs, seasons: seasons, season: season}
                };
                ui.update(data, req.raw.cb);
            });
        });
    }

    function playoffs(req) {
        beforeLeague(req, function () {
            var attributes, finalMatchups, season, seasonAttributes, seasons;

            season = helpers.validateSeason(req.params.season);
            seasons = helpers.getSeasons(season);

            function cb(finalMatchups, series) {
                var data;

                data = {
                    container: "league_content",
                    template: "playoffs",
                    title: "Playoffs - " + season,
                    vars: {finalMatchups: finalMatchups, series: series, seasons: seasons, season: season}
                };
                ui.update(data, req.raw.cb);
            }

            if (season === g.season && g.phase < c.PHASE_PLAYOFFS) {
                // In the current season, before playoffs start, display projected matchups
                finalMatchups = false;
                attributes = ["tid", "cid", "abbrev", "name"];
                seasonAttributes = ["winp"];
                db.getTeams(null, season, attributes, [], seasonAttributes, "winp", function (teams) {
                    var cid, i, j, keys, series, teamsConf;

                    series = [[], [], [], []];  // First round, second round, third round, fourth round
                    for (cid = 0; cid < 2; cid++) {
                        teamsConf = [];
                        for (i = 0; i < teams.length; i++) {
                            if (teams[i].cid === cid) {
                                teamsConf.push(teams[i]);
                            }
                        }
                        series[0][cid * 4] = {home: teamsConf[0], away: teamsConf[7]};
                        series[0][cid * 4].home.seed = 1;
                        series[0][cid * 4].away.seed = 8;
                        series[0][1 + cid * 4] = {home: teamsConf[1], away: teamsConf[6]};
                        series[0][1 + cid * 4].home.seed = 2;
                        series[0][1 + cid * 4].away.seed = 7;
                        series[0][2 + cid * 4] = {home: teamsConf[2], away: teamsConf[5]};
                        series[0][2 + cid * 4].home.seed = 3;
                        series[0][2 + cid * 4].away.seed = 6;
                        series[0][3 + cid * 4] = {home: teamsConf[3], away: teamsConf[4]};
                        series[0][3 + cid * 4].home.seed = 4;
                        series[0][3 + cid * 4].away.seed = 5;
                    }

                    cb(finalMatchups, series);
                });
            } else {
                // Display the current or archived playoffs
                finalMatchups = true;
                g.dbl.transaction(["playoffSeries"]).objectStore("playoffSeries").get(season).onsuccess = function (event) {
                    var playoffSeries, series;

                    playoffSeries = event.target.result;
                    series = playoffSeries.series;

                    cb(finalMatchups, series);
                };
            }
        });
    }

    function finances(req) {
        beforeLeague(req, function () {
            var attributes, seasonAttributes;

            attributes = ["tid", "abbrev", "region", "name"];
            seasonAttributes = ["att", "revenue", "profit", "cash", "payroll"];
            db.getTeams(null, g.season, attributes, [], seasonAttributes, "winp", function (teams) {
                var data, i;

                for (i = 0; i < teams.length; i++) {
                    teams[i].cash /= 1000000;
                }

                data = {
                    container: "league_content",
                    template: "finances",
                    title: "Finances",
                    vars: {salaryCap: g.salaryCap / 1000, teams: teams}
                };
                ui.update(data, req.raw.cb);
            });
        });
    }

    function history(req) {
        beforeLeague(req, function () {
            var attributes, season, seasonAttributes, seasons;

            season = helpers.validateSeason(req.params.season);

            // If playoffs aren't over, season awards haven't been set
            if (g.phase <= c.PHASE_PLAYOFFS) {
                // View last season by default
                if (season === g.season) {
                    season -= 1;
                }
                seasons = helpers.getSeasons(season, g.season);  // Don't show this season as an option
            } else {
                seasons = helpers.getSeasons(season);  // Show this season as an option
            }

            if (season < g.startingSeason) {
                helpers.error("There is no league history yet. Check back after the playoffs.", req);
                return;
            }

            g.dbl.transaction("awards").objectStore("awards").get(season).onsuccess = function (event) {
                var awards;

                awards = event.target.result;

                g.dbl.transaction("players").objectStore("players").index("retiredYear").getAll(season).onsuccess = function (event) {
                    var retiredPlayers;

                    retiredPlayers = db.getPlayers(event.target.result, season, null, ["pid", "name", "abbrev", "age"], [], ["ovr"]);

                    db.getTeams(null, season, ["abbrev", "region", "name"], [], ["leagueChamps"], null, function(teams) {
                        var champ, data, i;

                        for (i = 0; i < teams.length; i++) {
                            if (teams[i].leagueChamps) {
                                champ = teams[i];
                                break;
                            }
                        }

                        data = {
                            container: "league_content",
                            template: "history",
                            title: "Season Summary - " + season,
                            vars: {awards: awards, champ: champ, retiredPlayers: retiredPlayers, seasons: seasons, season: season}
                        };
                        ui.update(data, req.raw.cb);
                    });
                };
            };
        });
    }

    function roster(req) {
        beforeLeague(req, function () {
            var abbrev, attributes, currentSeason, ratings, season, seasons, sortable, stats, teams, tid, transaction;

            [tid, abbrev] = helpers.validateAbbrev(req.params.abbrev);
            season = helpers.validateSeason(req.params.season);
            seasons = helpers.getSeasons(season);
            teams = helpers.getTeams(tid);

            sortable = false;

            transaction = g.dbl.transaction(["players", "schedule", "teams"]);

            // Run after players are loaded
            function cb(players) {
                players[4].separator = true;

                transaction.objectStore("teams").get(tid).onsuccess = function (event) {
                    var data, j, team, teamAll, teamSeason;

                    teamAll = event.target.result;
                    for (j = 0; j < teamAll.seasons.length; j++) {
                        if (teamAll.seasons[j].season === season) {
                            teamSeason = teamAll.seasons[j];
                            break;
                        }
                    }
                    team = {region: teamAll.region, name: teamAll.name, cash: teamSeason.cash / 1000000};

                    data = {
                        container: "league_content",
                        template: "roster",
                        title: team.region + " " + team.name + " " + "Roster - " + season,
                        vars: {teams: teams, seasons: seasons, sortable: sortable, currentSeason: currentSeason, showTradeFor: currentSeason && tid !== g.userTid, players: players, numRosterSpots: 15 - players.length, team: team}
                    };
                    ui.update(data, req.raw.cb);
                };
            }

            attributes = ["pid", "name", "pos", "age", "contractAmount", "contractExp", "cashOwed", "rosterOrder"];
            ratings = ["ovr", "pot"];
            stats = ["min", "pts", "trb", "ast"];

            if (season === g.season) {
                // Show players currently on the roster
                currentSeason = true;

                if (tid === g.userTid) {
                    sortable = true;
                }
                transaction.objectStore("schedule").getAll().onsuccess = function (event) {
                    var i, numGamesRemaining, schedule;

                    // numGamesRemaining doesn't need to be calculated except for g.userTid, but it is.
                    schedule = event.target.result;
                    numGamesRemaining = 0;
                    for (i = 0; i < schedule.length; i++) {
                        if (tid === schedule[i].homeTid || tid === schedule[i].awayTid) {
                            numGamesRemaining += 1;
                        }
                    }

                    transaction.objectStore("players").index("tid").getAll(tid).onsuccess = function (event) {
                        var players;

                        players = db.getPlayers(event.target.result, season, tid, attributes, stats, ratings, {numGamesRemaining: numGamesRemaining, showRookies: true, sortBy: "rosterOrder", showNoStats: true});
                        cb(players);
                    };
                };
            } else {
                // Show all players with stats for the given team and year
                currentSeason = false;
                transaction.objectStore("players").index("statsTids").getAll(tid).onsuccess = function (event) {
                    var players;

                    players = db.getPlayers(event.target.result, season, tid, attributes, stats, ratings, {numGamesRemaining: 0, showRookies: true, sortBy: "rosterOrder"});
                    cb(players);
                };
            }
        });
    }

    function schedule(req) {
        beforeLeague(req, function () {
            season.getSchedule(null, 0, function (schedule_) {
                var data, game, games, i, row, team0, team1, vsat;

                games = [];
                for (i = 0; i < schedule_.length; i++) {
                    game = schedule_[i];
                    if (g.userTid === game.homeTid || g.userTid === game.awayTid) {
                        team0 = {tid: game.homeTid, abbrev: game.homeAbbrev, region: game.homeRegion, name: game.homeName};
                        team1 = {tid: game.awayTid, abbrev: game.awayAbbrev, region: game.awayRegion, name: game.awayName};
                        if (g.userTid === game.homeTid) {
                            vsat = "vs";
                        } else {
                            vsat = "at";
                        }
                        row = {teams: [team0, team1], vsat: vsat};
                        games.push(row);
                    }
                }

                data = {
                    container: "league_content",
                    template: "schedule",
                    title: "Schedule",
                    vars: {games: games}
                };
                ui.update(data, req.raw.cb);
            });
        });
    }

    function freeAgents(req) {
        beforeLeague(req, function () {
            if (g.phase >= c.PHASE_AFTER_TRADE_DEADLINE && g.phase <= c.PHASE_RESIGN_PLAYERS) {
                helpers.error("You're not allowed to sign free agents now.", req);
                return;
            }

            g.dbl.transaction(["players"]).objectStore("players").index("tid").getAll(c.PLAYER_FREE_AGENT).onsuccess = function (event) {
                var attributes, data, players, ratings, stats;

                attributes = ["pid", "name", "pos", "age", "contractAmount", "contractExp"];
                ratings = ["ovr", "pot"];
                stats = ["min", "pts", "trb", "ast"];

                players = db.getPlayers(event.target.result, g.season, c.PLAYER_FREE_AGENT, attributes, stats, ratings, {oldStats: true, showNoStats: true});

                data = {
                    container: "league_content",
                    template: "freeAgents",
                    title: "Free Agents",
                    vars: {players: players}
                };
                ui.update(data, req.raw.cb);
            };
        });
    }

    function trade_(req) {
        beforeLeague(req, function () {
            var abbrev, newOtherTid, pid, showTrade, validateSavedPids;

            if (g.phase >= c.PHASE_AFTER_TRADE_DEADLINE && g.phase <= c.PHASE_PLAYOFFS) {
                helpers.error("You're not allowed to make trades now.", req);
                return;
            }

            pid = typeof req.params.pid !== "undefined" ? Math.floor(pid) : null;
            if (typeof req.raw.abbrev !== "undefined") {
                [newOtherTid, abbrev] = helpers.validateAbbrev(req.raw.abbrev);
            } else {
                newOtherTid = null;
            }

            showTrade = function (userPids, otherPids, message) {
                message = typeof message !== "undefined" ? message : null;

                trade.getOtherTid(function (otherTid) {
                    var playerStore;

                    playerStore = g.dbl.transaction("players").objectStore("players");

                    playerStore.index("tid").getAll(g.userTid).onsuccess = function (event) {
                        var attributes, i, ratings, stats, userRoster;

                        attributes = ["pid", "name", "pos", "age", "contractAmount", "contractExp"];
                        ratings = ["ovr", "pot"];
                        stats = ["min", "pts", "trb", "ast"];
                        userRoster = db.getPlayers(event.target.result, g.season, g.userTid, attributes, stats, ratings, {showNoStats: true});
                        for (i = 0; i < userRoster.length; i++) {
                            if (userPids.indexOf(userRoster[i].pid) >= 0) {
                                userRoster[i].selected = true;
                            } else {
                                userRoster[i].selected = false;
                            }
                        }

                        playerStore.index("tid").getAll(otherTid).onsuccess = function (event) {
                            var i, otherRoster;

                            otherRoster = db.getPlayers(event.target.result, g.season, g.userTid, attributes, stats, ratings, {showNoStats: true});
                            for (i = 0; i < otherRoster.length; i++) {
                                if (otherPids.indexOf(otherRoster[i].pid) >= 0) {
                                    otherRoster[i].selected = true;
                                } else {
                                    otherRoster[i].selected = false;
                                }
                            }

                            trade.summary(otherTid, userPids, otherPids, function (summary) {
                                var data, teams, tradeSummary;

                                teams = helpers.getTeams(otherTid);
                                teams.splice(g.userTid, 1);  // Can't trade with yourself

                                tradeSummary = Handlebars.templates.tradeSummary({lid: g.lid, summary: summary, message: message});

                                data = {
                                    container: "league_content",
                                    template: "trade",
                                    title: "Trade",
                                    vars: {userRoster: userRoster, otherRoster: otherRoster, userPids: userPids, otherPids: otherPids, teams: teams, otherTid: otherTid, tradeSummary: tradeSummary, userTeamName: summary.teams[0].name}
                                };
                                ui.update(data, req.raw.cb);
                            });
                        };
                    };
                });
            };

            // Validate that the stored player IDs correspond with the active team ID
            validateSavedPids = function (cb) {
                trade.getPlayers(function (userPids, otherPids) {
                    trade.updatePlayers(userPids, otherPids, function (userPids, otherPids) {
                        cb(userPids, otherPids);
                    });
                });
            };

            if (req.method === "post" && typeof req.params.clear !== "undefined") {
                // Clear trade
                trade.clear(function () {
                    showTrade([], []);
                });
            } else if (req.method  === "post" && typeof req.params.propose !== "undefined") {
                // Propose trade
                trade.propose(function (accepted, message) {
                    trade.getPlayers(function (userPids, otherPids) {
                        showTrade(userPids, otherPids, message);
                    });
                });
            } else {
                // Start new trade with team or for player
                if (req.method === "post" && (newOtherTid !== null || pid !== null)) {
                    trade.create(newOtherTid, pid, function () {
                        validateSavedPids(function (userPids, otherPids) {
                            showTrade(userPids, otherPids);
                        });
                    });
                } else {
                    validateSavedPids(function (userPids, otherPids) {
                        showTrade(userPids, otherPids);
                    });
                }
            }
        });
    }

    function draft(req) {
        beforeLeague(req, function () {
            var playerStore, season, seasons;

            season = helpers.validateSeason(req.params.season);

            // Draft hasn't happened yet this year
            if (g.phase < c.PHASE_DRAFT) {
                // View last season by default
                if (season === g.season) {
                    season -= 1;
                }
                seasons = helpers.getSeasons(season, g.season);  // Don't show this season as an option
            } else {
                seasons = helpers.getSeasons(season);  // Show this season as an option
            }

            if (season < g.startingSeason) {
                helpers.error("There is no draft history yet. Check back after the draft.", req);
                return;
            }

            playerStore = g.dbl.transaction(["players"]).objectStore("players");
            // Active draft
            if (g.phase === c.PHASE_DRAFT && season === g.season) {
                playerStore.index("tid").getAll(c.PLAYER_UNDRAFTED).onsuccess = function (event) {
                    var i, pa, player, playersAll, pr, undrafted;
                    playersAll = event.target.result;
                    playersAll.sort(function (a, b) {  return (b.ratings[0].ovr + 2 * b.ratings[0].pot) - (a.ratings[0].ovr + 2 * a.ratings[0].pot); }); // Can use ratings[0] because pre-draft rookies only have one ratings entry

                    undrafted = [];
                    for (i = 0; i < playersAll.length; i++) {
                        pa = playersAll[i];

                        // Attributes
                        player = {pid: pa.pid, name: pa.name, pos: pa.pos, age: g.season - pa.bornYear};

                        // Ratings
                        pr = pa.ratings[0];
                        player.ovr = pr.ovr;
                        player.pot = pr.pot;

                        undrafted.push(player);
                    }

                    playerStore.index("draftYear").getAll(g.season).onsuccess = function (event) {
                        var data, drafted, draftAbbrev, draftOrder, draftTid, i, pa, player, playersAll, pr, slot, started;

                        playersAll = event.target.result;
                        playersAll.sort(function (a, b) {  return (g.numTeams * (a.draftRound - 1) + a.draftPick) - (g.numTeams * (b.draftRound - 1) + b.draftPick); });

                        drafted = [];
                        for (i = 0; i < playersAll.length; i++) {
                            pa = playersAll[i];

                            if (pa.tid !== c.PLAYER_UNDRAFTED) {
                                // Attributes
                                [draftTid, draftAbbrev] = helpers.validateTid(pa.draftTid);
                                player = {pid: pa.pid, name: pa.name, pos: pa.pos, age: g.season - pa.bornYear, abbrev: draftAbbrev, rnd: pa.draftRound, pick: pa.draftPick};

                                // Ratings
                                pr = pa.ratings[0];
                                player.ovr = pr.ovr;
                                player.pot = pr.pot;

                                drafted.push(player);
                            }
                        }

                        started = drafted.length > 0;

                        draftOrder = JSON.parse(localStorage.getItem("league" + g.lid + "DraftOrder"));
                        for (i = 0; i < draftOrder.length; i++) {
                            slot = draftOrder[i];
                            drafted.push({abbrev: slot.abbrev, rnd: slot.round, pick: slot.pick});
                        }

                        data = {
                            container: "league_content",
                            template: "draft",
                            title: "Draft",
                            vars: {undrafted: undrafted, drafted: drafted, started: started}
                        };
                        ui.update(data, req.raw.cb);
                    };
                };
                return;
            }

            // Show a summary of an old draft
            playerStore.index("draftYear").getAll(season).onsuccess = function (event) {
                var currentAbbrev, currentPr, currentTid, data, draftAbbrev, draftPr, draftTid, i, j, pa, player, players, playersAll, ps;

                playersAll = event.target.result;

                players = [];
                for (i = 0; i < playersAll.length; i++) {
                    pa = playersAll[i];

                    if (pa.draftRound === 1 || pa.draftRound === 2) {
                        // Attributes
                        [currentTid, currentAbbrev] = helpers.validateTid(pa.tid);
                        [draftTid, draftAbbrev] = helpers.validateTid(pa.draftTid);
                        player = {pid: pa.pid, name: pa.name, pos: pa.pos, rnd: pa.draftRound, pick: pa.draftPick, draftAge: pa.draftYear - pa.bornYear, draftAbbrev: draftAbbrev, currentAge: g.season - pa.bornYear, currentAbbrev: currentAbbrev};

                        // Ratings
                        draftPr = pa.ratings[0];
                        currentPr = pa.ratings[pa.ratings.length - 1];
                        player.draftOvr = draftPr.ovr;
                        player.draftPot = draftPr.pot;
                        player.currentOvr = currentPr.ovr;
                        player.currentPot = currentPr.pot;

                        // Stats
                        player.gp = 0;
                        player.min = 0;
                        player.pts = 0;
                        player.trb = 0;
                        player.ast = 0;
                        for (j = 0; j < pa.stats.length; j++) {
                            if (pa.stats[j].playoffs === false) {
                                ps = pa.stats[j];
                                player.gp += ps.gp;
                                player.min += ps.min;
                                player.pts += ps.pts;
                                player.trb += ps.trb;
                                player.ast += ps.ast;
                            }
                        }
                        if (typeof ps !== "undefined" && ps.gp > 0) {
                            player.min = player.min / player.gp;
                            player.pts = player.pts / player.gp;
                            player.trb = player.trb / player.gp;
                            player.ast = player.ast / player.gp;
                        } else {
                            player.min = 0;
                            player.pts = 0;
                            player.trb = 0;
                            player.ast = 0;
                        }

                        players.push(player);
                    }
                }

                data = {
                    container: "league_content",
                    template: "draftSummary",
                    title: "Draft Results - " + season,
                    vars: {players: players, seasons: seasons}
                };
                ui.update(data, req.raw.cb);
            };
        });
    }

    function gameLog(req) {
        beforeLeague(req, function () {
            var abbrev, boxScore, gameLogList, gid, season, seasons, teams, tid;

            [tid, abbrev] = helpers.validateAbbrev(req.params.abbrev);
            season = helpers.validateSeason(req.params.season);
            seasons = helpers.getSeasons(season);
            teams = helpers.getTeams(tid);
            gid = typeof req.params.gid !== "undefined" ? parseInt(req.params.gid, 10) : null;

            gameLogList = function (abbrev, season, cb) {
                var games, tid;

                [tid, abbrev] = helpers.validateAbbrev(abbrev);
                season = helpers.validateSeason(season);

                games = [];
                g.dbl.transaction(["games"]).objectStore("games").index("season").openCursor(season).onsuccess = function (event) {
                    var content, cursor, game, home, opp, oppPts, pts, tidMatch, won;

                    cursor = event.target.result;
                    if (cursor) {
                        game = cursor.value;

                        // Check tid
                        tidMatch = false;
                        if (game.teams[0].tid === tid) {
                            tidMatch = true;
                            home = true;
                            pts = game.teams[0].pts;
                            oppPts = game.teams[1].pts;
                            opp = helpers.validateTid(game.teams[1].tid);
                        } else if (game.teams[1].tid === tid) {
                            tidMatch = true;
                            home = false;
                            pts = game.teams[1].pts;
                            oppPts = game.teams[0].pts;
                            opp = helpers.validateTid(game.teams[0].tid);
                        }

                        if (tidMatch) {
                            if (pts > oppPts) {
                                won = true;
                            } else {
                                won = false;
                            }
                            games.push({gid: game.gid, home: home, oppAbbrev: opp[1], won: won, pts: pts, oppPts: oppPts});
                            if (game.gid === gid) {
                                _.last(games).selected = true;
                            }
                        }

                        cursor.continue();
                    } else {
                        content = Handlebars.templates.gameLogList({lid: g.lid, abbrev: abbrev, games: games, season: season});
                        cb(content);
                    }
                };
            };

            boxScore = function (gid, cb) {
                if (gid !== null) {
                    gid = parseInt(gid, 10);

                    g.dbl.transaction(["games"]).objectStore("games").get(gid).onsuccess = function (event) {
                        var content, i, game;

                        game = event.target.result;
                        for (i = 0; i < game.teams.length; i++) {
                            game.teams[i].players[4].separator = true;
                            _.last(game.teams[i].players).separator = true;
                        }

                        content = Handlebars.templates.boxScore({lid: g.lid, game: game});
                        cb(content);
                    };
                } else {
                    cb("<p>Select a game from the menu on the right to view a box score.</p>");
                }
            };

            gameLogList(abbrev, season, function (contentGameLogList) {
                boxScore(gid, function (contentBoxScore) {
                    var data;

                    data = {
                        container: "league_content",
                        template: "gameLog",
                        title: "Game Log",
                        vars: {boxScore: contentBoxScore, gameLogList: contentGameLogList, gid: gid, teams: teams, seasons: seasons}
                    };
                    ui.update(data, req.raw.cb);
                });
            });
        });
    }

    function leaders(req) {
        beforeLeague(req, function () {
            var season, seasons;

            season = helpers.validateSeason(req.params.season);
            seasons = helpers.getSeasons(season);

            g.dbl.transaction(["players"]).objectStore("players").getAll().onsuccess = function (event) {
                var attributes, categories, data, i, j, players, ratings, stats, userAbbrev;

                userAbbrev = helpers.getAbbrev(g.userTid);

                categories = [];
                categories.push({name: "Points", stat: "Pts", title: "Points Per Game", data: []});
                categories.push({name: "Rebounds", stat: "Reb", title: "Rebounds Per Game", data: []});
                categories.push({name: "Assists", stat: "Ast", title: "Assists Per Game", data: []});
                categories.push({name: "Field Goal Percentage", stat: "FG%", title: "Field Goal Percentage", data: []});
                categories.push({name: "Blocks", stat: "Blk", title: "Blocks Per Game", data: []});
                categories.push({name: "Steals", stat: "Stl", title: "Steals Per Game", data: []});

                attributes = ["pid", "name"];
                ratings = [];
                stats = ["pts", "trb", "ast", "fgp", "blk", "stl", "abbrev"];  // This needs to be in the same order as categories
                players = db.getPlayers(event.target.result, season, null, attributes, stats, ratings);

                for (i = 0; i < categories.length; i++) {
                    players.sort(function (a, b) {  return b[stats[i]] - a[stats[i]]; });
                    for (j = 0; j < 10; j++) {
                        categories[i].data[j] = helpers.deepCopy(players[j]);
                        categories[i].data[j].i = j + 1;
                        categories[i].data[j].stat = categories[i].data[j][stats[i]];
                        delete categories[i].data[j][stats[i]];
                        if (userAbbrev === categories[i].data[j].abbrev) {
                            categories[i].data[j].userTeam = true;
                        } else {
                            categories[i].data[j].userTeam = false;
                        }
                    }
                    if (i === 3) {
                        categories[i].newRow = true;
                    } else {
                        categories[i].newRow = false;
                    }
                }

                data = {
                    container: "league_content",
                    template: "leaders",
                    title: "League Leaders - " + season,
                    vars: {categories: categories, season: season, seasons: seasons}
                };
                ui.update(data, req.raw.cb);
            };
        });
    }

    function playerRatings(req) {
        beforeLeague(req, function () {
            var season, seasons;

            season = helpers.validateSeason(req.params.season);
            seasons = helpers.getSeasons(season);

            g.dbl.transaction(["players"]).objectStore("players").getAll().onsuccess = function (event) {
                var attributes, data, players, ratings, stats;
                attributes = ["pid", "name", "pos", "age"];
                ratings = ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"];
                stats = ["abbrev"];

                players = db.getPlayers(event.target.result, season, null, attributes, stats, ratings);

                data = {
                    container: "league_content",
                    template: "playerRatings",
                    title: "Player Ratings - " + season,
                    vars: {players: players, season: season, seasons: seasons}
                };
                ui.update(data, req.raw.cb);
            };
        });
    }

    function playerStats(req) {
        beforeLeague(req, function () {
            var season, seasons;

            season = helpers.validateSeason(req.params.season);
            seasons = helpers.getSeasons(season);

            g.dbl.transaction(["players"]).objectStore("players").getAll().onsuccess = function (event) {
                var attributes, data, players, ratings, stats;
                attributes = ["pid", "name", "pos", "age"];
                ratings = [];
                stats = ["abbrev", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts"];

                players = db.getPlayers(event.target.result, season, null, attributes, stats, ratings, {showRookies: true});

                data = {
                    container: "league_content",
                    template: "playerStats",
                    title: "Player Stats - " + season,
                    vars: {players: players, season: season, seasons: seasons}
                };
                ui.update(data, req.raw.cb);
            };
        });
    }

    function teamStats(req) {
        beforeLeague(req, function () {
            var attributes, season, seasonAttributes, seasons, stats;

            season = helpers.validateSeason(req.params.season);
            seasons = helpers.getSeasons(season);

            attributes = ["abbrev"];
            stats = ["gp", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "oppPts"];
            seasonAttributes = ["won", "lost"];
            db.getTeams(null, season, attributes, stats, seasonAttributes, null, function (teams) {
                var data;

                data = {
                    container: "league_content",
                    template: "teamStats",
                    title: "Team Stats - " + season,
                    vars: {teams: teams, season: season, seasons: seasons}
                };
                ui.update(data, req.raw.cb);
            });
        });
    }

    function player_(req) {
        beforeLeague(req, function () {
            var pid;

            pid = typeof req.params.pid !== "undefined" ? parseInt(req.params.pid, 10) : undefined;

            g.dbl.transaction(["players"]).objectStore("players").get(pid).onsuccess = function (event) {
                var attributes, currentRatings, data, player, ratings, stats;

                attributes = ["pid", "name", "tid", "abbrev", "teamRegion", "teamName", "pos", "age", "hgtFt", "hgtIn", "weight", "bornYear", "bornLoc", "contractAmount", "contractExp", "draftYear", "draftRound", "draftPick", "draftAbbrev", "face"];
                ratings = ["season", "abbrev", "age", "ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"];
                stats = ["season", "abbrev", "age", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts"];

                player = db.getPlayer(event.target.result, null, null, attributes, stats, ratings);

                currentRatings = player.ratings[player.ratings.length - 1];

                data = {
                    container: "league_content",
                    template: "player",
                    title: player.name,
                    vars: {player: player, currentRatings: currentRatings, showTradeFor: player.tid !== g.userTid}
                };
                ui.update(data, req.raw.cb);
            };
        });
    }

    function negotiationList(req) {
        beforeLeague(req, function () {
            var negotiations;

            // If there is only one active negotiation with a free agent, go to it;
            negotiations = JSON.parse(localStorage.getItem("league" + g.lid + "Negotiations"));
            if (negotiations.length === 1) {
                Davis.location.assign(new Davis.Request("/l/" + g.lid + "/negotiation/" + negotiations[0].pid));
                return;
            }

            if (g.phase !== c.PHASE_RESIGN_PLAYERS) {
                helpers.error("Something bad happened.", req);
                return;
            }

            // Get all free agents, filter array based on negotiations data, pass to db.getPlayers, augment with contract data from negotiations
            g.dbl.transaction(["players"]).objectStore("players").index("tid").getAll(c.PLAYER_FREE_AGENT).onsuccess = function (event) {
                var attributes, data, i, j, players, playersAll, playersSome, ratings, stats;

                playersAll = event.target.result;
                playersSome = [];
                for (i = 0; i < playersAll.length; i++) {
                    for (j = 0; j < negotiations.length; j++) {
                        if (playersAll[i].pid === negotiations[j].pid) {
                            playersSome.push(playersAll[i]);
                            break;
                        }
                    }
                }

                attributes = ["pid", "name", "pos", "age"];
                stats = ["min", "pts", "trb", "ast"];
                ratings = ["ovr", "pot"];

                players = db.getPlayers(playersSome, g.season, g.userTid, attributes, stats, ratings, {sortBy: "rosterOrder", showNoStats: true});

                for (i = 0; i < players.length; i++) {
                    for (j = 0; j < negotiations.length; j++) {
                        if (players[i].pid === negotiations[j].pid) {
                            players[i].contractAmount = negotiations[j].playerAmount / 1000;
                            players[i].contractExp = g.season + negotiations[j].playerYears;
                            break;
                        }
                    }
                }

                data = {
                    container: "league_content",
                    template: "negotiationList",
                    title: "Resign Players",
                    vars: {players: players}
                };
                ui.update(data, req.raw.cb);
            };
        });
    }

    function negotiation(req) {
        beforeLeague(req, function () {
            var found, i, negotiations, pid, teamAmountNew, teamYearsNew;

            pid = parseInt(req.params.pid, 10);

            function cbDisplayNegotiation() {
                var found, negotiation, negotiations;

                if (req.method === "post") {
                    Davis.location.assign(new Davis.Request("/l/" + g.lid + "/negotiation/" + pid));
                    return;
                }

                negotiations = JSON.parse(localStorage.getItem("league" + g.lid + "Negotiations"));
                negotiation = null;
                for (i = 0; i < negotiations.length; i++) {
                    if (negotiations[i].pid === pid) {
                        negotiation = negotiations[i];
                        break;
                    }
                }
                if (negotiation === null) {
                    helpers.error("No negotiation with player " + pid + " in progress.", req);
                    return;
                }

                negotiation.playerAmount /= 1000;
                negotiation.teamAmount /= 1000;
                negotiation.playerExpiration = negotiation.playerYears + g.season;
                // Adjust to account for in-season signings;
                if (g.phase <= c.PHASE_AFTER_TRADE_DEADLINE) {
                    negotiation.playerExpiration -= 1;
                }

                g.dbl.transaction(["players"]).objectStore("players").get(pid).onsuccess = function (event) {
                    var data, j, pa, payroll, player, pr, team, teams;

                    pa = event.target.result;

                    // Attributes
                    player = {pid: pid, name: pa.name};

                    // Ratings
                    for (j = 0; j < pa.ratings.length; j++) {
                        if (pa.ratings[j].season === g.season) {
                            pr = pa.ratings[j];
                            break;
                        }
                    }
                    player.ovr = pr.ovr;
                    player.pot = pr.pot;

                    teams = helpers.getTeams();
                    team = {region: teams[g.userTid].region, name: teams[g.userTid].name};

                    db.getPayroll(null, g.userTid, function (payroll) {
                        payroll /= 1000;

                        data = {
                            container: "league_content",
                            template: "negotiation",
                            title: "Contract Negotiation - " + player.name,
                            vars: {negotiation: negotiation, player: player, salaryCap: g.salaryCap / 1000, team: team, payroll: payroll}
                        };
                        ui.update(data, req.raw.cb);
                    });
                };
            }

            // Any action requires a POST. GET will just view the status of the
            // negotiation, if (it exists
            if (req.method === "post") {
                if (req.params.hasOwnProperty("cancel")) {
                    contractNegotiation.cancel(pid);
                    Davis.location.assign(new Davis.Request("/l/" + g.lid));
                } else if (req.params.hasOwnProperty("accept")) {
                    contractNegotiation.accept(pid);
                } else if (req.params.hasOwnProperty("new")) {
                    // If there is no active negotiation with this pid, create it;
                    negotiations = JSON.parse(localStorage.getItem("league" + g.lid + "Negotiations"));
                    found = false;
                    for (i = 0; i < negotiations.length; i++) {
                        if (negotiations[i].pid === pid) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        contractNegotiation.create(null, pid, false, cbDisplayNegotiation);
                    }
                } else {
                    // Make an offer to the player;
                    teamAmountNew = parseInt(req.params.teamAmount * 1000, 10);
                    teamYearsNew = parseInt(req.params.teamYears, 10);
                    contractNegotiation.offer(pid, teamAmountNew, teamYearsNew);
                    cbDisplayNegotiation();
                }
            } else {
                cbDisplayNegotiation();
            }
        });
    }

    /**
     * Display a whole-page error message to the user.
     * 
     * @memberOf views
     * @param {Object} req Object with parameter "params" containing another object with a string representing the error message in the parameter "error".
     */
    function globalError(req) {
        var data;

        beforeNonLeague();

        data = {
            container: "content",
            template: "error",
            title: "Error",
            vars: {error: req.params.error}
        };
        ui.update(data, req.raw.cb);
    }

    /**
     * Display a whole-page error message to the user, while retaining the league menu.
     * 
     * @memberOf views
     * @param {Object} req Object with parameter "params" containing another object with a string representing the error message in the parameter "error" and an integer league ID in "lid".
     */
    function leagueError(req) {
        beforeLeague(req, function () {
            var data;

            data = {
                container: "league_content",
                template: "error",
                title: "Error",
                vars: {error: req.params.error}
            };
            ui.update(data, req.raw.cb);
        });
    }

    return {
        init_db: init_db,

        dashboard: dashboard,
        newLeague: newLeague,
        deleteLeague: deleteLeague,

        leagueDashboard: leagueDashboard,
        standings: standings,
        playoffs: playoffs,
        finances: finances,
        history: history,
        roster: roster,
        schedule: schedule,
        freeAgents: freeAgents,
        trade: trade_,
        draft: draft,
        gameLog: gameLog,
        leaders: leaders,
        playerRatings: playerRatings,
        playerStats: playerStats,
        teamStats: teamStats,
        player: player_,
        negotiationList: negotiationList,
        negotiation: negotiation,

        globalError: globalError,
        leagueError: leagueError
    };
});