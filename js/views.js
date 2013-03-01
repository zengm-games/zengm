define(["db", "ui", "core/contractNegotiation", "core/game", "core/league", "core/season", "core/trade", "util/helpers"], function (db, ui, contractNegotiation, game, league, season, trade, helpers) {
    "use strict";

    function beforeLeague(req, cb) {
        var checkDbChange, leagueMenu, popup;

        g.lid = parseInt(req.params.lid, 10);

        popup = req.params.w === "popup";

        checkDbChange = function (lid) {
            var oldLastDbChange;

            // Stop if the league isn't viewed anymore
            if (lid !== g.lid) {
                return;
            }

            oldLastDbChange = g.lastDbChange;

            db.loadGameAttribute(null, "lastDbChange", function () {
                if (g.lastDbChange !== oldLastDbChange) {
                    db.loadGameAttributes(function () {
                        ui.realtimeUpdate(function () {
                            ui.updatePlayMenu(null, function () {
                                ui.updatePhase();
                                ui.updateStatus();
                                setTimeout(checkDbChange, 3000, g.lid);
                            });
                        });
                    });
                } else {
                    setTimeout(checkDbChange, 3000, g.lid);
                }
            });
        };

        // Make sure league exists


        // Make sure league template FOR THE CURRENT LEAGUE is showing
        leagueMenu = document.getElementById("league_menu");
        if (leagueMenu === null || parseInt(leagueMenu.dataset.lid, 10) !== g.lid) {
            // Clear old game attributes from g, to make sure the new ones are saved to the db in db.setGameAttributes
            helpers.resetG();

            // Connect to league database
            db.connectLeague(g.lid, function () {
                db.loadGameAttributes(function () {
                    var css, data;

                    data = {
                        container: "content",
                        template: "leagueLayout",
                        vars: {}
                    };
                    ui.update(data);

                    // Set up the display for a popup: menus hidden, margins decreased, and new window links removed
                    if (popup) {
                        $("#top_menu").hide();
                        $("#league_menu").hide();
                        $("#league_content").css("margin-left", 0);
                        $("body").css("padding-top", "4px");

                        css = document.createElement("style");
                        css.type = "text/css";
                        css.innerHTML = ".new_window { display: none }";
                        document.body.appendChild(css);
                    }

                    // Update play menu
                    ui.updateStatus();
                    ui.updatePhase();
                    ui.updatePlayMenu(null, function () {
                        cb();
                        checkDbChange(g.lid);
                    });
                });
            });
        } else {
            cb();
        }
    }

    function beforeNonLeague() {
        var playButtonElement, playPhaseElement, playStatusElement;

        g.lid = null;

        playButtonElement = document.getElementById("playButton");
        if (playButtonElement) {
            playButtonElement.innerHTML = "";
        }
        playPhaseElement = document.getElementById("playPhase");
        if (playPhaseElement) {
            playPhaseElement.innerHTML = "";
        }
        playStatusElement = document.getElementById("playStatus");
        if (playStatusElement) {
            playStatusElement.innerHTML = "";
        }
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
                        request = indexedDB.deleteDatabase("meta");
                        request.onsuccess = function (event) {
                            // Create new meta database
                            console.log("Creating new meta database...");
                            db.connectMeta(function () {
                                console.log("Done!");
                                Davis.location.assign(new Davis.Request("/"));
                            });
                        };
                    }
                });
            }
        };
    }

    function dashboard(req) {
        beforeNonLeague();

        g.dbm.transaction("leagues").objectStore("leagues").getAll().onsuccess = function (event) {
            var data, i, leagues, teams;

            leagues = event.target.result;
            teams = helpers.getTeams();

            for (i = 0; i < leagues.length; i++) {
                leagues[i].region = teams[leagues[i].tid].region;
                leagues[i].teamName = teams[leagues[i].tid].name;
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
        var name, randomName, tid;

        beforeNonLeague();

        // Pick a random league name, either for the GET or POST phase
        randomName = g.nickNames[Math.floor(Math.random() * g.nickNames.length)];

        if (req.method === "get") {
            g.dbm.transaction("teams").objectStore("teams").getAll().onsuccess = function (event) {
                var data, teams;

                teams = event.target.result;

                data = {
                    container: "content",
                    template: "newLeague",
                    title: "Create New League",
                    vars: {teams: teams, randomName: randomName}
                };
                ui.update(data);
            };
        } else if (req.method === "post") {
            tid = Math.floor(req.params.tid);
            name = req.params.name.length > 0 ? req.params.name : randomName;
            if (tid >= 0 && tid <= 29) {
                league.create(name, tid, req.params.players, function (lid) {
                    Davis.location.assign(new Davis.Request("/l/" + lid));
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

    function manual(req) {
        var data, page;

        beforeNonLeague();

        page = req.params.page !== undefined ? req.params.page : "overview";

        if (page === "overview") {
            data = {
                container: "content",
                template: "manualOverview",
                title: "Manual",
                vars: {}
            };
        }
        ui.update(data, req.raw.cb);
    }

    function leagueDashboard(req) {
        beforeLeague(req, function () {
            var transaction, vars;

            vars = {};
            vars.season = g.season;
            vars.salaryCap = g.salaryCap / 1000;  // [millions of dollars]

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
                vars.cash = userTeamSeason.cash / 1000;  // [millions of dollars]

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

                    vars.payroll = payroll / 1000;  // [millions of dollars]

                    attributes = ["tid", "cid"];
                    stats = ["pts", "oppPts", "trb", "ast"];  // This is also used later to find ranks for these team stats
                    seasonAttributes = ["won", "lost", "winp", "streakLong", "att", "revenue", "profit"];
                    db.getTeams(transaction, g.season, attributes, stats, seasonAttributes, {sortBy: "winp"}, function (teams) {
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

                        transaction.objectStore("games").index("season").getAll(g.season).onsuccess = function (event) {
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

                                g.dbl.transaction(["players"]).objectStore("players").index("tid").getAll(IDBKeyRange.lowerBound(c.PLAYER_RETIRED, true)).onsuccess = function (event) {
                                    var attributes, i, freeAgents, leagueLeaders, players, ratings, stats, userPlayers;

                                    attributes = ["pid", "name", "abbrev", "tid", "age", "contractAmount", "contractExp", "rosterOrder"];
                                    ratings = ["ovr", "pot"];
                                    stats = ["pts", "trb", "ast"];  // This is also used later to find team/league leaders for these player stats
                                    players = db.getPlayers(event.target.result, g.season, null, attributes, stats, ratings, {showNoStats: true});

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
                                        if (userPlayers[i].contractExp === g.season || (g.phase >= c.PHASE_RESIGN_PLAYERS && userPlayers[i].contractExp === g.season + 1)) {
                                            vars.expiring.push({
                                                pid: userPlayers[i].pid,
                                                name: userPlayers[i].name,
                                                age: userPlayers[i].age,
                                                pts: userPlayers[i].stats.pts,
                                                contractAmount: userPlayers[i].contractAmount,
                                                ovr: userPlayers[i].ratings.ovr,
                                                pot: userPlayers[i].ratings.pot
                                            });
                                        }
                                    }

                                    // Free agents
                                    freeAgents = _.filter(players, function (p) { return p.tid === c.PLAYER_FREE_AGENT; });
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

                                    g.dbl.transaction(["playoffSeries"]).objectStore("playoffSeries").get(g.season).onsuccess = function (event) {
                                        var data, found, i, playoffSeries, rnd, series;

                                        playoffSeries = event.target.result;
                                        vars.showPlayoffSeries = false;
                                        vars.playoffsStarted = g.phase >= c.PHASE_PLAYOFFS;
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

                                        data = {
                                            container: "league_content",
                                            template: "leagueDashboard",
                                            title: "Dashboard",
                                            vars: vars
                                        };
                                        ui.update(data, req.raw.cb);
                                    };
                                };
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
            db.getTeams(null, season, attributes, [], seasonAttributes, {sortBy: "winp"}, function (teams) {
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
                db.getTeams(null, season, attributes, [], seasonAttributes, {sortBy: "winp"}, function (teams) {
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
                g.dbl.transaction("playoffSeries").objectStore("playoffSeries").get(season).onsuccess = function (event) {
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
            db.getTeams(null, g.season, attributes, [], seasonAttributes, {}, function (teams) {
                var data, i;

                for (i = 0; i < teams.length; i++) {
                    teams[i].cash /= 1000;  // [millions of dollars]
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

                    retiredPlayers = db.getPlayers(event.target.result, season, null, ["pid", "name", "age"], [], ["ovr"]);

                    db.getTeams(null, season, ["abbrev", "region", "name"], [], ["leagueChamps"], {}, function (teams) {
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
            var abbrev, attributes, currentSeason, out, ratings, season, seasons, sortable, stats, teams, tid, transaction;

            out = helpers.validateAbbrev(req.params.abbrev);
            tid = out[0];
            abbrev = out[1];
            season = helpers.validateSeason(req.params.season);
            seasons = helpers.getSeasons(season);
            teams = helpers.getTeams(tid);

            sortable = false;

            transaction = g.dbl.transaction(["players", "releasedPlayers", "schedule", "teams"]);

            // Run after players are loaded
            function cb(players, payroll) {
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
                    team = {region: teamAll.region, name: teamAll.name, cash: teamSeason.cash / 1000};

                    for (j = 0; j < players.length; j++) {
                        if (players.length > 5) {
                            players[j].canRelease = true;
                            if (players[j].cashOwed <= team.cash) {
                                players[j].canBuyOut = true;
                            }
                        }
                    }

                    data = {
                        container: "league_content",
                        template: "roster",
                        title: team.region + " " + team.name + " " + "Roster - " + season,
                        vars: {teams: teams, seasons: seasons, sortable: sortable, currentSeason: currentSeason, showTradeFor: currentSeason && tid !== g.userTid, players: players, numRosterSpots: 15 - players.length, team: team, payroll: payroll, salaryCap: g.salaryCap / 1000}
                    };
                    ui.update(data, req.raw.cb);
                };
            }

            attributes = ["pid", "name", "pos", "age", "contractAmount", "contractExp", "cashOwed", "rosterOrder"];
            ratings = ["ovr", "pot", "skills"];
            stats = ["min", "pts", "trb", "ast", "per"];

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
                        var i, players;

                        players = db.getPlayers(event.target.result, season, tid, attributes, stats, ratings, {numGamesRemaining: numGamesRemaining, showRookies: true, sortBy: "rosterOrder", showNoStats: true});
                        db.getPayroll(transaction, tid, function (payroll) {
                            cb(players, payroll / 1000);
                        });
                    };
                };
            } else {
                // Show all players with stats for the given team and year
                currentSeason = false;
                transaction.objectStore("players").index("statsTids").getAll(tid).onsuccess = function (event) {
                    var i, players;

                    players = db.getPlayers(event.target.result, season, tid, attributes, stats, ratings, {numGamesRemaining: 0, showRookies: true, sortBy: "rosterOrder"});

                    // Fix ages
                    for (i = 0; i < players.length; i++) {
                        players[i].age = players[i].age - (g.season - season);
                    }

                    cb(players, null);
                };
            }
        });
    }

    function schedule(req) {
        beforeLeague(req, function () {
            season.getSchedule(null, 0, function (schedule_) {
                var data, game, games, i, row, team0, team1;

                games = [];
                for (i = 0; i < schedule_.length; i++) {
                    game = schedule_[i];
                    if (g.userTid === game.homeTid || g.userTid === game.awayTid) {
                        team0 = {tid: game.homeTid, abbrev: game.homeAbbrev, region: game.homeRegion, name: game.homeName};
                        team1 = {tid: game.awayTid, abbrev: game.awayAbbrev, region: game.awayRegion, name: game.awayName};
                        if (g.userTid === game.homeTid) {
                            row = {teams: [team1, team0], vsat: "vs"};
                        } else {
                            row = {teams: [team0, team1], vsat: "at"};
                        }
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

    function teamHistory(req) {
        beforeLeague(req, function () {
            g.dbl.transaction("teams").objectStore("teams").get(g.userTid).onsuccess = function (event) {
                var abbrev, data, extraText, history, i, userTeam, userTeamSeason;

                userTeam = event.target.result;

                abbrev = userTeam.abbrev;

                history = [];
                // 3 most recent years
                for (i = 0; i < userTeam.seasons.length; i++) {
                    extraText = "";
                    if (userTeam.seasons[i].leagueChamps) {
                        extraText = "league champs";
                    } else if (userTeam.seasons[i].confChamps) {
                        extraText = "conference champs";
                    } else if (userTeam.seasons[i].madePlayoffs) {
                        extraText = "made playoffs";
                    }

                    history.push({
                        season: userTeam.seasons[i].season,
                        won: userTeam.seasons[i].won,
                        lost: userTeam.seasons[i].lost,
                        extraText: extraText
                    });
                }
                history.reverse(); // Show most recent season first

                data = {
                    container: "league_content",
                    template: "teamHistory",
                    title: "Team History",
                    vars: {abbrev: abbrev, history: history}
                };
                ui.update(data, req.raw.cb);
            };
        });
    }

    function freeAgents(req) {
        beforeLeague(req, function () {
            if (g.phase >= c.PHASE_AFTER_TRADE_DEADLINE && g.phase <= c.PHASE_RESIGN_PLAYERS) {
                if (g.phase === c.PHASE_RESIGN_PLAYERS) {
                    Davis.location.assign(new Davis.Request("/l/" + g.lid + "/negotiation"));
                    return;
                }

                helpers.error("You're not allowed to sign free agents now.", req);
                return;
            }

            g.dbl.transaction(["players"]).objectStore("players").index("tid").getAll(c.PLAYER_FREE_AGENT).onsuccess = function (event) {
                var attributes, data, i, players, ratings, stats;

                attributes = ["pid", "name", "pos", "age", "contractAmount", "contractExp", "freeAgentTimesAsked"];
                ratings = ["ovr", "pot", "skills"];
                stats = ["min", "pts", "trb", "ast", "per"];

                players = db.getPlayers(event.target.result, g.season, c.PLAYER_FREE_AGENT, attributes, stats, ratings, {oldStats: true, showNoStats: true});

                for (i = 0; i < players.length; i++) {
                    players[i].contractAmount = players[i].contractAmount * (1 + players[i].freeAgentTimesAsked / 10);
                    delete players[i].freeAgentTimesAsked;
                }

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
            var abbrev, newOtherTid, out, pid, showTrade, validateSavedPids;

            if (g.phase >= c.PHASE_AFTER_TRADE_DEADLINE && g.phase <= c.PHASE_PLAYOFFS) {
                helpers.error("You're not allowed to make trades now.", req);
                return;
            }

            pid = req.params.pid !== undefined ? parseInt(req.params.pid, 10) : null;
            if (req.raw.abbrev !== undefined) {
                out = helpers.validateAbbrev(req.raw.abbrev);
                newOtherTid = out[0];
                abbrev = out[1];
            } else {
                newOtherTid = null;
            }

            showTrade = function (userPids, otherPids, message) {
                message = message !== undefined ? message : null;
                if (message === null && req.raw.message !== undefined) {
                    message = req.raw.message; // Passed explicitly a couple lines below. Otherwise, undefined.
                }

                if (req.method === "post") {
                    // Refresh, but pass the latest message if there is one
                    return Davis.location.assign(new Davis.Request("/l/" + g.lid + "/trade", {message: message}));
                }

                trade.getOtherTid(function (otherTid) {
                    var playerStore;

                    playerStore = g.dbl.transaction("players").objectStore("players");

                    playerStore.index("tid").getAll(g.userTid).onsuccess = function (event) {
                        var attributes, i, ratings, stats, userRoster;

                        attributes = ["pid", "name", "pos", "age", "contractAmount", "contractExp"];
                        ratings = ["ovr", "pot", "skills"];
                        stats = ["min", "pts", "trb", "ast", "per"];
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

                            otherRoster = db.getPlayers(event.target.result, g.season, otherTid, attributes, stats, ratings, {showNoStats: true});
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

            if (req.method === "post" && req.params.clear !== undefined) {
                // Clear trade
                trade.clear(function () {
                    showTrade([], []);
                });
            } else if (req.method  === "post" && req.params.propose !== undefined) {
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
                        player.skills = pr.skills;

                        undrafted.push(player);
                    }

                    playerStore.index("draftYear").getAll(g.season).onsuccess = function (event) {
                        var drafted, draftAbbrev, draftTid, i, pa, player, playersAll, pr, started;

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
                                player.skills = pr.skills;

                                drafted.push(player);
                            }
                        }

                        started = drafted.length > 0;

                        db.getDraftOrder(function (draftOrder) {
                            var data, i, slot;

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
                        });
                    };
                };
                return;
            }

            // Show a summary of an old draft
            playerStore.index("draftYear").getAll(season).onsuccess = function (event) {
                var attributes, currentPr, data, draftPr, i, pa, player, players, playersAll, ratings, stats;

                attributes = ["tid", "abbrev", "draftTid", "draftAbbrev", "pid", "name", "pos", "draftRound", "draftPick", "draftAge", "age"];
                ratings = ["ovr", "pot", "skills"];
                stats = ["gp", "min", "pts", "trb", "ast", "per"];  // This needs to be in the same order as categories
                playersAll = db.getPlayers(event.target.result, null, null, attributes, stats, ratings);

                players = [];
                for (i = 0; i < playersAll.length; i++) {
                    pa = playersAll[i];

                    if (pa.draftRound === 1 || pa.draftRound === 2) {
                        // Attributes
                        player = {pid: pa.pid, name: pa.name, pos: pa.pos, rnd: pa.draftRound, pick: pa.draftPick, draftAge: pa.draftAge, draftAbbrev: pa.draftAbbrev, currentAge: pa.age, currentAbbrev: pa.abbrev};

                        // Ratings
                        draftPr = pa.ratings[0];
                        currentPr = _.last(pa.ratings);
                        player.draftOvr = draftPr.ovr;
                        player.draftPot = draftPr.pot;
                        player.draftSkills = draftPr.skills;
                        player.currentOvr = currentPr.ovr;
                        player.currentPot = currentPr.pot;
                        player.currentSkills = currentPr.skills;

                        // Stats
                        player.careerStats = pa.careerStats;

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
            var abbrev, cbBoxScore, cbDisplay, cbGameLogList, gid, out, season, seasons, teams, tid;

            out = helpers.validateAbbrev(req.params.abbrev);
            tid = out[0];
            abbrev = out[1];
            season = helpers.validateSeason(req.params.season);
            seasons = helpers.getSeasons(season);
            teams = helpers.getTeams(tid);
            gid = req.params.gid !== undefined ? parseInt(req.params.gid, 10) : null;

            cbGameLogList = function (abbrev, season, cb) {
                var games, out, tid;

                out = helpers.validateAbbrev(abbrev);
                tid = out[0];
                abbrev = out[1];
                season = helpers.validateSeason(season);

                games = [];
                g.dbl.transaction(["games"]).objectStore("games").index("season").getAll(season).onsuccess = function (event) {
                    var content, i, games, gamesAll, overtime;

                    gamesAll = event.target.result;

                    games = [];
                    for (i = 0; i < gamesAll.length; i++) {
                        if (gamesAll[i].overtimes === 1) {
                            overtime = " (OT)";
                        } else if (gamesAll[i].overtimes > 1) {
                            overtime = " (" + gamesAll[i].overtimes + "OT)";
                        } else {
                            overtime = "";
                        }

                        // Check tid
                        if (gamesAll[i].teams[0].tid === tid) {
                            games.push({
                                gid: gamesAll[i].gid,
                                home: true,
                                pts: gamesAll[i].teams[0].pts,
                                oppPts: gamesAll[i].teams[1].pts,
                                oppAbbrev: helpers.getAbbrev(gamesAll[i].teams[1].tid),
                                won: gamesAll[i].teams[0].pts > gamesAll[i].teams[1].pts,
                                selected: gamesAll[i].gid === gid,
                                overtime: overtime
                            });
                        } else if (gamesAll[i].teams[1].tid === tid) {
                            games.push({
                                gid: gamesAll[i].gid,
                                home: false,
                                pts: gamesAll[i].teams[1].pts,
                                oppPts: gamesAll[i].teams[0].pts,
                                oppAbbrev: helpers.getAbbrev(gamesAll[i].teams[0].tid),
                                won: gamesAll[i].teams[1].pts > gamesAll[i].teams[0].pts,
                                selected: gamesAll[i].gid === gid,
                                overtime: overtime
                            });
                        }
                    }

                    content = Handlebars.templates.gameLogList({lid: g.lid, abbrev: abbrev, games: games, season: season});
                    cb(content);
                };
            };

            cbBoxScore = function (gid, contentGameLogList, cb) {
                if (gid !== null) {
                    gid = parseInt(gid, 10);

                    g.dbl.transaction(["games"]).objectStore("games").get(gid).onsuccess = function (event) {
                        var content, i, game, overtime;

                        game = event.target.result;
                        for (i = 0; i < game.teams.length; i++) {
                            game.teams[i].players[4].separator = true;
                            _.last(game.teams[i].players).separator = true;

                            // Fix the total minutes calculation, because JavaScript only has floats so it gets fucked up
                            game.teams[i].min = 240 + 25 * game.overtimes;
                        }

                        if (game.overtimes === 1) {
                            overtime = " (OT)";
                        } else if (game.overtimes > 1) {
                            overtime = " (" + game.overtimes + "OT)";
                        } else {
                            overtime = "";
                        }

                        content = Handlebars.templates.boxScore({lid: g.lid, game: game, overtime: overtime, season: season});
                        cb(contentGameLogList, content);
                    };
                } else {
                    cb(contentGameLogList, "<p>Select a game from the menu on the right to view the box score.</p>");
                }
            };

            cbDisplay = function (contentGameLogList, contentGameInfo) {
                var data;

                data = {
                    container: "league_content",
                    template: "gameLog",
                    title: "Game Log",
                    vars: {boxScore: contentGameInfo, gameLogList: contentGameLogList, gid: gid, teams: teams, seasons: seasons}
                };
                ui.update(data, req.raw.cb);
            };

            cbGameLogList(abbrev, season, function (contentGameLogList) {
                cbBoxScore(gid, contentGameLogList, cbDisplay);
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
                ratings = ["skills"];
                stats = ["pts", "trb", "ast", "fgp", "blk", "stl", "abbrev"];  // This needs to be in the same order as categories
                players = db.getPlayers(event.target.result, season, null, attributes, stats, ratings);

                for (i = 0; i < categories.length; i++) {
                    players.sort(function (a, b) { return b.stats[stats[i]] - a.stats[stats[i]]; });
                    for (j = 0; j < 10; j++) {
                        categories[i].data[j] = helpers.deepCopy(players[j]);
                        categories[i].data[j].i = j + 1;
                        categories[i].data[j].stat = categories[i].data[j].stats[stats[i]];
                        categories[i].data[j].abbrev = categories[i].data[j].stats.abbrev;
                        delete categories[i].data[j].stats;
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
                var attributes, data, i, players, ratings, stats;
                attributes = ["pid", "name", "pos", "age"];
                ratings = ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb", "skills"];
                stats = ["abbrev"];

                players = db.getPlayers(event.target.result, season, null, attributes, stats, ratings);

                // Fix ages
                for (i = 0; i < players.length; i++) {
                    players[i].age = players[i].age - (g.season - season);
                }

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
                ratings = ["skills"];
                stats = ["abbrev", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "per"];

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
            db.getTeams(null, season, attributes, stats, seasonAttributes, {}, function (teams) {
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

            pid = req.params.pid !== undefined ? parseInt(req.params.pid, 10) : undefined;

            g.dbl.transaction(["players"]).objectStore("players").get(pid).onsuccess = function (event) {
                var attributes, currentRatings, data, player, ratings, stats;

                attributes = ["pid", "name", "tid", "abbrev", "teamRegion", "teamName", "pos", "age", "hgtFt", "hgtIn", "weight", "bornYear", "bornLoc", "contractAmount", "contractExp", "draftYear", "draftRound", "draftPick", "draftAbbrev", "face", "freeAgentTimesAsked"];
                ratings = ["season", "abbrev", "age", "ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb", "skills"];
                stats = ["season", "abbrev", "age", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "per"];

                player = db.getPlayer(event.target.result, null, null, attributes, stats, ratings);

                // Account for extra free agent demands
                if (player.tid === c.PLAYER_FREE_AGENT) {
                    player.contractAmount = player.contractAmount * (1 + player.freeAgentTimesAsked / 10);
                }

                currentRatings = player.ratings[player.ratings.length - 1];

                data = {
                    container: "league_content",
                    template: "player",
                    title: player.name,
                    vars: {player: player, currentRatings: currentRatings, showTradeFor: player.tid !== g.userTid && player.tid >= 0, freeAgent: player.tid === c.PLAYER_FREE_AGENT, retired: player.tid === c.PLAYER_RETIRED, showContract: player.tid !== c.PLAYER_UNDRAFTED && player.tid !== c.PLAYER_RETIRED}
                };
                ui.update(data, req.raw.cb);
            };
        });
    }

    function negotiationList(req) {
        beforeLeague(req, function () {
            var negotiations;

            // If there is only one active negotiation with a free agent, go to it
            g.dbl.transaction("negotiations").objectStore("negotiations").getAll().onsuccess = function (event) {
                var negotiations;

                negotiations = event.target.result;

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
                    stats = ["min", "pts", "trb", "ast", "per"];
                    ratings = ["ovr", "pot", "skills"];

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
            };
        });
    }

    function negotiation(req) {
        beforeLeague(req, function () {
            var cbDisplayNegotiation, cbRedirectNegotiationOrRoster, found, i, pid, teamAmountNew, teamYearsNew;

            pid = parseInt(req.params.pid, 10);

            cbDisplayNegotiation = function (error) {
                if (error !== undefined && error) {
                    return helpers.error(error, req);
                }

                if (req.method === "post") {
                    return Davis.location.assign(new Davis.Request("/l/" + g.lid + "/negotiation/" + pid));
                }

                g.dbl.transaction("negotiations").objectStore("negotiations").get(pid).onsuccess = function (event) {
                    var negotiation;

                    negotiation = event.target.result;

                    if (!negotiation) {
                        return helpers.error("No negotiation with player " + pid + " in progress.", req);
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
                };
            };

            // Show the negotiations list if there are more ongoing negotiations
            cbRedirectNegotiationOrRoster = function (error) {
                if (error !== undefined && error) {
                    return helpers.error(error, req);
                }

                g.dbl.transaction("negotiations").objectStore("negotiations").getAll().onsuccess = function (event) {
                    var negotiations;

                    negotiations = event.target.result;

                    if (negotiations.length > 0) {
                        Davis.location.assign(new Davis.Request("/l/" + g.lid + "/negotiation"));
                    } else {
                        Davis.location.assign(new Davis.Request("/l/" + g.lid + "/roster"));
                    }
                };
            };

            // Any action requires a POST. GET will just view the status of the
            // negotiation, if (it exists
            if (req.method === "post") {
                if (req.params.hasOwnProperty("cancel")) {
                    contractNegotiation.cancel(pid);
                    cbRedirectNegotiationOrRoster();
                } else if (req.params.hasOwnProperty("accept")) {
                    contractNegotiation.accept(pid, cbRedirectNegotiationOrRoster);
                } else if (req.params.hasOwnProperty("new")) {
                    // If there is no active negotiation with this pid, create it;
                    g.dbl.transaction("negotiations").objectStore("negotiations").get(pid).onsuccess = function (event) {
                        var negotiation;

                        negotiation = event.target.result;

                        if (!negotiation) {
                            contractNegotiation.create(null, pid, false, cbDisplayNegotiation);
                        } else {
                            cbDisplayNegotiation();
                        }
                    };
                } else {
                    // Make an offer to the player;
                    teamAmountNew = parseInt(req.params.teamAmount * 1000, 10);
                    teamYearsNew = parseInt(req.params.teamYears, 10);
                    contractNegotiation.offer(pid, teamAmountNew, teamYearsNew, cbDisplayNegotiation);
                }
            } else {
                cbDisplayNegotiation();
            }
        });
    }

    function distPlayerRatings(req) {
        beforeLeague(req, function () {
            var season, seasons;

            season = helpers.validateSeason(req.params.season);
            seasons = helpers.getSeasons(season);

            g.dbl.transaction(["players"]).objectStore("players").getAll().onsuccess = function (event) {
                var attributes, data, players, ratings, ratingsAll, stats;
                attributes = [];
                ratings = ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"];
                stats = [];

                players = db.getPlayers(event.target.result, season, null, attributes, stats, ratings);
//console.log(players);

                ratingsAll = _.reduce(players, function (memo, player) {
                    var rating;
                    for (rating in player.ratings) {
                        if (player.ratings.hasOwnProperty(rating)) {
                            if (memo.hasOwnProperty(rating)) {
                                memo[rating].push(player.ratings[rating]);
                            } else {
                                memo[rating] = [player.ratings[rating]];
                            }
                        }
                    }
                    return memo;
                }, {});

                data = {
                    container: "league_content",
                    template: "distPlayerRatings",
                    title: "Player Rating Distributions - " + season,
                    vars: {season: season, seasons: seasons}
                };
                ui.update(data, function () {
                    var rating, tbody;

                    tbody = $("#dist_player_ratings tbody");

                    for (rating in ratingsAll) {
                        if (ratingsAll.hasOwnProperty(rating)) {
                            tbody.append('<tr><td style="text-align: right; padding-right: 1em;">' + rating + '</td><td width="100%"><div id="' + rating + 'BoxPlot"></div></td></tr>');

                            boxPlot.create({
                                data: ratingsAll[rating],
                                scale: [0, 100],
                                container: rating + "BoxPlot"
                            });
                        }
                    }

                    if (req.raw.cb !== undefined) {
                        req.raw.cb();
                    }
                });
            };
        });
    }

    function distPlayerStats(req) {
        beforeLeague(req, function () {
            var season, seasons;

            season = helpers.validateSeason(req.params.season);
            seasons = helpers.getSeasons(season);

            g.dbl.transaction(["players"]).objectStore("players").getAll().onsuccess = function (event) {
                var attributes, data, nbaQuartiles, players, ratings, stats, statsAll;
                attributes = [];
                ratings = [];
                stats = ["gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts"];

                players = db.getPlayers(event.target.result, season, null, attributes, stats, ratings);

                statsAll = _.reduce(players, function (memo, player) {
                    var stat;
                    for (stat in player.stats) {
                        if (player.stats.hasOwnProperty(stat)) {
                            if (memo.hasOwnProperty(stat)) {
                                memo[stat].push(player.stats[stat]);
                            } else {
                                memo[stat] = [player.stats[stat]];
                            }
                        }
                    }
                    return memo;
                }, {});

                nbaQuartiles = {
                    gp: [1, 25, 52, 74, 82],
                    min: [0, 11.4857142857, 20.3759398496, 28.6286673736, 41.359375],
                    fg: [0, 1.2676056338, 2.6043478261, 4.2253994954, 10.1052631579],
                    fga: [0, 2.976744186, 6, 9.144963145, 21.96875],
                    fgp: [0, 39.6551724138, 44.2206477733, 48.7304827389, 100],
                    tp: [0, 0, 0.25, 0.9499921863, 3],
                    tpa: [0, 0.0545454545, 0.9326923077, 2.7269647696, 7.064516129],
                    tpp: [0, 0, 28.5714285714, 35.7142857143, 100],
                    ftm: [0, 0.5, 1.069047619, 2.0634920635, 9.2195121951],
                    fta: [0, 0.7464788732, 1.5282193959, 2.8446447508, 10.243902439],
                    ftp: [0, 63.6363636364, 74.184204932, 81.4814814815, 100],
                    orb: [0, 0.3333333333, 0.6938888889, 1.3094934014, 4.4285714286],
                    drb: [0, 1.2272727273, 2.0930735931, 3.2760889292, 9.7317073171],
                    trb: [0, 1.625, 2.8438363737, 4.5811403509, 13.1951219512],
                    ast: [0, 0.5438596491, 1.1645833333, 2.3024060646, 11.012345679],
                    tov: [0, 0.5769230769, 0.9638501742, 1.5492063492, 3.796875],
                    stl: [0, 0.2985074627, 0.5330668605, 0.8278070175, 2.3333333333],
                    blk: [0, 0.1111111111, 0.23875, 0.5, 2.7804878049],
                    pf: [0, 1.2307692308, 1.828536436, 2.4295634921, 4],
                    pts: [0, 3.3333333333, 7.0507246377, 11.2698735321, 30.1463414634]
                };

                data = {
                    container: "league_content",
                    template: "distPlayerStats",
                    title: "Player Stat Distributions - " + season,
                    vars: {season: season, seasons: seasons}
                };
                ui.update(data, function () {
                    var scale, stat, tbody;

                    tbody = $("#dist_player_stats tbody");

                    // Scales for the box plots. This is not done dynamically so that the plots will be comparable across seasons.
                    scale = {
                        gp: [0, 82],
                        gs: [0, 82],
                        min: [0, 50],
                        fg: [0, 20],
                        fga: [0, 40],
                        fgp: [0, 100],
                        tp: [0, 5],
                        tpa: [0, 10],
                        tpp: [0, 100],
                        ft: [0, 15],
                        fta: [0, 25],
                        ftp: [0, 100],
                        orb: [0, 10],
                        drb: [0, 15],
                        trb: [0, 25],
                        ast: [0, 15],
                        tov: [0, 10],
                        stl: [0, 5],
                        blk: [0, 5],
                        pf: [0, 6],
                        pts: [0, 50]
                    };

                    for (stat in statsAll) {
                        if (statsAll.hasOwnProperty(stat)) {
                            tbody.append('<tr><td style="text-align: right; padding-right: 1em;">' + stat + '</td><td width="100%"><div id="' + stat + 'BoxPlot"></div></td></tr>');

                            boxPlot.create({
                                data: statsAll[stat],
                                scale: scale[stat],
                                container: stat + "BoxPlot"
                            });

                            if (nbaQuartiles.hasOwnProperty(stat)) {
                                tbody.append('<tr><td></td><td width="100%"><div id="' + stat + 'BoxPlotNba" style="margin-top: -26px"></div></td></tr>');
                                boxPlot.create({
                                    quartiles: nbaQuartiles[stat],
                                    scale: scale[stat],
                                    container: stat + "BoxPlotNba",
                                    color: "#0088cc",
                                    labels: false
                                });
                            }
                        }
                    }

                    if (req.raw.cb !== undefined) {
                        req.raw.cb();
                    }
                });
            };
        });
    }

    function distTeamStats(req) {
        beforeLeague(req, function () {
            var attributes, season, seasonAttributes, seasons, stats;

            season = helpers.validateSeason(req.params.season);
            seasons = helpers.getSeasons(season);

            attributes = [];
            stats = ["fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "oppPts"];
            seasonAttributes = ["won", "lost"];
            db.getTeams(null, season, attributes, stats, seasonAttributes, {}, function (teams) {
                var data, nbaStatsAll, statsAll;

                statsAll = _.reduce(teams, function (memo, team) {
                    var stat;
                    for (stat in team) {
                        if (team.hasOwnProperty(stat)) {
                            if (memo.hasOwnProperty(stat)) {
                                memo[stat].push(team[stat]);
                            } else {
                                memo[stat] = [team[stat]];
                            }
                        }
                    }
                    return memo;
                }, {});

                nbaStatsAll = {
                    won: [50, 42, 43, 40, 55, 61, 36, 58, 57, 17, 57, 46, 37, 39, 24, 52, 22, 41, 32, 62, 23, 30, 56, 48, 19, 44, 46, 24, 34, 35],
                    lost: [32, 40, 39, 42, 27, 21, 46, 24, 25, 65, 25, 36, 45, 43, 58, 30, 60, 41, 50, 20, 59, 52, 26, 34, 63, 38, 36, 58, 48, 47],
                    fg: [38.4, 38.3, 38.7, 39.3, 37.4, 38.4, 39.6, 37, 38.1, 37.7, 37.4, 39, 36.6, 37.4, 38.2, 36, 38.3, 38.1, 36.8, 37.1, 37.2, 37.3, 36.9, 36, 35.2, 36.2, 35.9, 35.6, 35, 34.3],
                    fga: [80.6, 83.7, 85.1, 83.5, 80.6, 80.8, 85.9, 76.8, 82.4, 85.5, 78.8, 82.9, 82.8, 80.4, 85.1, 78.2, 82.4, 82.6, 80.4, 80.3, 84, 81.1, 75.8, 80.5, 81.1, 78.4, 78.2, 81, 77.6, 79.8],
                    fgp: [47.6, 45.7, 45.4, 47, 46.4, 47.5, 46.1, 48.1, 46.3, 44.1, 47.5, 47.1, 44.2, 46.5, 44.9, 46.1, 46.5, 46.1, 45.7, 46.2, 44.3, 46, 48.6, 44.7, 43.4, 46.2, 45.9, 44, 45.1, 43],
                    tp: [8.1, 9.3, 8.3, 8.5, 5.9, 8.4, 8.4, 6.7, 6.4, 7.2, 7.9, 3.8, 7.1, 5.3, 5.2, 9.4, 4.2, 5.4, 6.3, 6.2, 4.8, 5.8, 5, 6.3, 6.2, 6.1, 5.4, 5.6, 4.8, 5.9],
                    tpa: [20.8, 25.4, 22.5, 22.6, 17.1, 21.1, 21.3, 18, 18.1, 19.1, 21.6, 11.3, 20.2, 15.3, 15.6, 25.6, 13.3, 15.2, 18.5, 17.3, 14.4, 15.3, 13.6, 18.3, 18.2, 17.4, 15, 16.3, 14.7, 17.2],
                    tpp: [38.8, 36.8, 36.7, 37.7, 34.7, 39.7, 39.2, 37, 35.2, 37.6, 36.5, 33.4, 35.4, 34.6, 33.5, 36.6, 31.6, 35.5, 33.8, 36.1, 33.2, 37.6, 36.5, 34.5, 34.2, 35.2, 36, 34.3, 32.7, 34.2],
                    ft: [22.7, 20.6, 20.3, 18, 24.1, 18.5, 15.7, 21.5, 18.8, 18.5, 17.5, 18.1, 19.4, 19.4, 17.7, 17.7, 18.2, 17.4, 18.9, 18.2, 18.2, 16.7, 17.8, 18, 18.9, 16.4, 17.7, 17.4, 18.4, 17.4],
                    fta: [29.6, 25.5, 25.4, 23.6, 29.3, 24.2, 20.7, 27.9, 24.1, 24.1, 22.6, 24.2, 24.8, 25.1, 24.2, 25.6, 24.1, 22.6, 26.7, 24.5, 24.4, 22.6, 23.1, 22.4, 25.3, 21.1, 23.1, 22.9, 24.4, 22.9],
                    ftp: [76.5, 80.9, 80.1, 75.9, 82.3, 76.7, 76.1, 76.9, 77.9, 76.8, 77.7, 75, 78.2, 77.1, 73.4, 69.2, 75.5, 77, 70.7, 74.3, 74.5, 73.7, 77, 80.4, 74.5, 77.9, 76.5, 75.9, 75.6, 75.7],
                    orb: [9.6, 10.3, 11.7, 10, 11, 10.1, 11.6, 9.6, 12.1, 13.2, 9.5, 11.8, 11.1, 11, 13.1, 10.5, 11.7, 10.4, 11.7, 11.8, 12.4, 11.4, 7.8, 12.1, 10.4, 9.3, 10, 11.1, 10.3, 10.5],
                    drb: [32.3, 30.1, 31.1, 30.2, 31.8, 31.7, 28.9, 32.5, 31.9, 31.2, 31.9, 29.2, 32.4, 28.5, 30.8, 32.7, 28.6, 31.4, 30.5, 32.4, 29, 27.3, 31, 27.2, 29.9, 30, 30.1, 29.8, 29.8, 30.2],
                    trb: [42, 40.5, 42.8, 40.2, 42.8, 41.9, 40.5, 42.1, 44, 44.4, 41.4, 41, 43.5, 39.5, 43.9, 43.2, 40.3, 41.8, 42.1, 44.2, 41.3, 38.6, 38.8, 39.3, 40.3, 39.3, 40.1, 40.8, 40.1, 40.8],
                    ast: [22.1, 21.4, 23.8, 23.7, 20.4, 22.4, 22.5, 20, 22, 20.1, 23.8, 20.6, 19.6, 23.4, 20.4, 20, 21.9, 22.7, 22.1, 22.3, 19.4, 21.1, 23.4, 21.2, 21, 22, 20.6, 21, 21.1, 18.8],
                    tov: [13.8, 13.3, 12.8, 13.6, 13.5, 12.9, 14.1, 13.2, 12.6, 16.5, 13.5, 13.4, 14.8, 13.6, 15.6, 14.4, 14, 12.2, 15.5, 13.5, 14.7, 12.2, 13.6, 12.4, 13.7, 12.8, 12.2, 13, 13.7, 12.5],
                    stl: [7.4, 7.6, 7.1, 6.6, 8, 7.3, 9, 6.6, 7.3, 7.2, 6.8, 9.4, 7.1, 7.7, 7.4, 6.7, 7.1, 7.6, 7.1, 7.2, 8.1, 7.3, 8.2, 8, 6.6, 6.1, 7.6, 5.6, 6.4, 7.5],
                    blk: [4.3, 5.8, 4.5, 4.4, 5.9, 4.5, 5, 5.2, 5.1, 5.1, 4.3, 5.4, 5.6, 5.9, 4.8, 4.7, 4.3, 4.3, 4.9, 5.7, 6.1, 4, 4.2, 4.4, 4.2, 4.2, 4.4, 4.7, 5.3, 4.9],
                    pf: [21, 21.3, 20, 20.3, 22.4, 19, 22, 20.4, 19, 22.3, 19.2, 20.8, 21.7, 22.7, 22, 20, 22, 19.4, 21.1, 20, 22.6, 19.9, 20.5, 19.3, 20.1, 19, 21, 22, 20, 20.5],
                    pts: [107.5, 106.5, 105.9, 105, 104.8, 103.7, 103.4, 102.1, 101.5, 101.1, 100.2, 99.9, 99.8, 99.4, 99.4, 99.2, 99.1, 99, 98.6, 98.6, 97.3, 97, 96.5, 96.3, 95.5, 95, 94.9, 94.2, 93.3, 91.9],
                    oppPts: [102.7, 105.7, 103.7, 105.9, 101, 98, 105.7, 94.6, 95.4, 107.7, 96, 97.6, 100.9, 101.3, 104.7, 93.7, 105.4, 97.5, 101.8, 91.3, 104.7, 100.6, 91.1, 94.8, 104.5, 95.8, 94, 100.4, 97.3, 92.7]
                };

                data = {
                    container: "league_content",
                    template: "distTeamStats",
                    title: "Team Stat Distributions - " + season,
                    vars: {season: season, seasons: seasons}
                };
                ui.update(data, function () {
                    var scale, stat, tbody;

                    tbody = $("#dist_team_stats tbody");

                    // Scales for the box plots. This is not done dynamically so that the plots will be comparable across seasons.
                    scale = {
                        won: [0, 82],
                        lost: [0, 82],
                        fg: [30, 70],
                        fga: [60, 140],
                        fgp: [35, 50],
                        tp: [0, 15],
                        tpa: [0, 30],
                        tpp: [20, 50],
                        ft: [5, 25],
                        fta: [10, 30],
                        ftp: [60, 90],
                        orb: [0, 30],
                        drb: [20, 60],
                        trb: [30, 90],
                        ast: [15, 40],
                        tov: [5, 20],
                        stl: [0, 15],
                        blk: [0, 15],
                        pf: [5, 25],
                        pts: [80, 130],
                        oppPts: [80, 130]
                    };

                    for (stat in statsAll) {
                        if (statsAll.hasOwnProperty(stat)) {
                            tbody.append('<tr><td style="text-align: right; padding-right: 1em;">' + stat + '</td><td width="100%"><div id="' + stat + 'BoxPlot"></div></td></tr>');

                            boxPlot.create({
                                data: statsAll[stat],
                                scale: scale[stat],
                                container: stat + "BoxPlot"
                            });

                            if (nbaStatsAll.hasOwnProperty(stat)) {
                                tbody.append('<tr><td></td><td width="100%"><div id="' + stat + 'BoxPlotNba" style="margin-top: -26px"></div></td></tr>');
                                boxPlot.create({
                                    data: nbaStatsAll[stat],
                                    scale: scale[stat],
                                    container: stat + "BoxPlotNba",
                                    color: "#0088cc",
                                    labels: false
                                });
                            }
                        }
                    }

                    if (req.raw.cb !== undefined) {
                        req.raw.cb();
                    }
                });
            });
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
        manual: manual,

        leagueDashboard: leagueDashboard,
        standings: standings,
        playoffs: playoffs,
        finances: finances,
        history: history,
        roster: roster,
        schedule: schedule,
        teamHistory: teamHistory,
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
        distPlayerRatings: distPlayerRatings,
        distPlayerStats: distPlayerStats,
        distTeamStats: distTeamStats,

        globalError: globalError,
        leagueError: leagueError
    };
});