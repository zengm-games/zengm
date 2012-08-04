define(["bbgm", "db", "core/contractNegotiation", "core/game", "core/league", "core/season", "util/helpers", "util/playMenu"], function (bbgm, db, contractNegotiation, game, league, season, helpers, playMenu) {
    "use strict";

    function beforeLeague(req, cb) {
        var leagueMenu, request;

        g.lid = parseInt(req.params.lid, 10);
        helpers.loadGameAttributes();

        // Make sure league exists


        // Make sure league template FOR THE CURRENT LEAGUE is showing
        leagueMenu = document.getElementById("league_menu");
        if (leagueMenu === null || parseInt(leagueMenu.dataset.lid, 10) !== g.lid) {
            // Connect to league database
            request = db.connect_league(g.lid);
            request.onsuccess = function (event) {
                var data, template;

                g.dbl = request.result;
                g.dbl.onerror = function (event) {
                    console.log("League database error: " + event.target.errorCode);
                };

                data = {};
                template = Handlebars.templates.league_layout;
                data.content = template({g: g});
                bbgm.ajaxUpdate(data);

                // Update play menu
                playMenu.setStatus();
                playMenu.setPhase();
                playMenu.refreshOptions();

                cb();
            };
        } else {
            cb();
        }
    }

    function beforeNonLeague() {
        document.getElementById("playButton").innerHTML = '';
        document.getElementById("playPhase").innerHTML = '';
        document.getElementById("playStatus").innerHTML = '';
    }

    function init_db(req) {
        beforeNonLeague();

        // Delete any current league databases
        console.log("Deleting any current league databases...");
        if (g.dbl !== undefined) {
            g.dbl.close();
        }
        g.dbm.transaction(["leagues"]).objectStore("leagues").getAll().onsuccess = function (event) {
            var data, i, leagues, request;

            leagues = event.target.result;

            for (i = 0; i < leagues.length; i++) {
                g.indexedDB.deleteDatabase("league" + leagues[i].lid);
                localStorage.removeItem("league" + leagues[i].lid + "GameAttributes");
                localStorage.removeItem("league" + leagues[i].lid + "DraftOrder");
                localStorage.removeItem("league" + leagues[i].lid + "Negotiations");
            }

            // Delete any current meta database
            console.log("Deleting any current meta database...");
            g.dbm.close();
            g.indexedDB.deleteDatabase("meta");

            // Create new meta database
            console.log("Creating new meta database...");
            request = db.connect_meta();
            request.onsuccess = function (event) {
                g.dbm = request.result;
                g.dbm.onerror = function (event) {
                    console.log("Meta database error: " + event.target.errorCode);
                };

                console.log("Done!");
            };
        };
    }

    function dashboard(req) {
        beforeNonLeague();

        g.dbm.transaction(["leagues"]).objectStore("leagues").getAll().onsuccess = function (event) {
            var data, leagues, template;

            leagues = event.target.result;

            data = {title: "Dashboard"};
            template = Handlebars.templates.dashboard;
            data.content = template({leagues: leagues});

            bbgm.ajaxUpdate(data);
        };
    }

    function new_league(req) {
        var tid;

        beforeNonLeague();

        if (req.method === "get") {
            g.dbm.transaction(["teams"]).objectStore("teams").getAll().onsuccess = function (event) {
                var data, teams, template;

                teams = event.target.result;

                data = {title: "Create New League"};
                template = Handlebars.templates.newLeague;
                data.content = template({teams: teams});

                bbgm.ajaxUpdate(data);
            };
        } else if (req.method === "post") {
            tid = parseInt(req.params.tid, 10);
            if (tid >= 0 && tid <= 29) {
                league.create(tid, req.params.players);
            }
        }
    }

    function delete_league(req) {
        var lid;

        lid = parseInt(req.params.lid, 10);
        league.remove(lid);
        req.redirect('/');
    }

    function league_dashboard(req) {
        beforeLeague(req, function () {
            var data, template;

            data = {title: "Dashboard - League " + g.lid};
            template = Handlebars.templates.leagueDashboard;
            data.league_content = template({g: g});

            bbgm.ajaxUpdate(data);
        });
    }

    function standings(req) {
        beforeLeague(req, function () {
            var attributes, season, seasonAttributes, seasons;

            season = typeof req.params.season !== "undefined" ? req.params.season : undefined;
            season = helpers.validateSeason(season);
            seasons = helpers.getSeasons(season);

            attributes = ["tid", "cid", "did", "abbrev", "region", "name"];
            seasonAttributes = ["won", "lost", "winp", "wonDiv", "lostDiv", "wonConf", "lostConf"];
            db.getTeams(null, season, attributes, [], seasonAttributes, "winp", function (teams) {
                var confs, confTeams, data, divTeams, i, j, k, template;

                confs = [];
                for (i = 0; i < g.confs.length; i++) {
                    confTeams = [];
                    for (k = 0; k < teams.length; k++) {
                        if (g.confs[i].cid === teams[k].cid) {
                            confTeams.push(teams[k]);
                        }
                    }

                    confs.push({name: g.confs[i].name, divs: [], teams: confTeams});

                    for (j = 0; j < g.divs.length; j++) {
                        if (g.divs[j].cid === g.confs[i].cid) {
                            divTeams = [];
                            for (k = 0; k < teams.length; k++) {
                                if (g.divs[j].did === teams[k].did) {
                                    divTeams.push(teams[k]);
                                }
                            }

                            confs[i].divs.push({name: g.divs[j].name, teams: divTeams});
                        }
                    }
                }

                data = {title: "Standings - League " + g.lid};
                template = Handlebars.templates.standings;
                data.league_content = template({g: g, confs: confs, seasons: seasons, season: season});

                bbgm.ajaxUpdate(data);
            });
        });
    }

    function playoffs(req) {
        beforeLeague(req, function () {
            var attributes, finalMatchups, season, seasonAttributes, seasons;

            season = typeof req.params.season !== "undefined" ? req.params.season : undefined;
            season = helpers.validateSeason(season);
            seasons = helpers.getSeasons(season);

            function cb(finalMatchups, series) {
                var data, template;

                data = {title: "Playoffs - League " + g.lid};
                template = Handlebars.templates.playoffs;
                data.league_content = template({g: g, finalMatchups: finalMatchups, series: series, seasons: seasons, season: season});
                bbgm.ajaxUpdate(data);
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
                var data, i, template;

                for (i = 0; i < teams.length; i++) {
                    teams[i].cash /= 1000000;
                }

                data = {title: "Finances - League " + g.lid};
                template = Handlebars.templates.finances;
                data.league_content = template({g: g, salaryCap: g.salaryCap / 1000, teams: teams});
                bbgm.ajaxUpdate(data);
            });
        });
    }

    function history(req) {
        beforeLeague(req, function () {
            var attributes, season, seasonAttributes, seasons;

            season = typeof req.params.season !== "undefined" ? req.params.season : undefined;
            season = helpers.validateSeason(season);

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
                helpers.error("There is no league history yet. Check back after the playoffs.");
                return;
            }

            g.dbl.transaction("awards").objectStore("awards").get(season).onsuccess = function (event) {
                var awards;

                awards = event.target.result;

                g.dbl.transaction("players").objectStore("players").index("retiredYear").getAll(season).onsuccess = function (event) {
                    var retiredPlayers;

                    retiredPlayers = db.getPlayers(event.target.result, season, null, ["pid", "name", "abbrev", "age"], [], ["ovr"]);

                    db.getTeams(null, season, ["abbrev", "region", "name"], [], ["leagueChamps"], null, function(teams) {
                        var champ, data, i, template;

                        for (i = 0; i < teams.length; i++) {
                            if (teams[i].leagueChamps) {
                                champ = teams[i];
                                break;
                            }
                        }

                        data = {title: season + " Season Summary - League " + g.lid};
                        template = Handlebars.templates.history;
                        data.league_content = template({g: g, awards: awards, champ: champ, retiredPlayers: retiredPlayers, seasons: seasons, season: season});
                        bbgm.ajaxUpdate(data);
                    })
                };
            };
        });
    }

    function roster(req) {
        beforeLeague(req, function () {
            var abbrev, attributes, currentSeason, ratings, season, seasons, sortable, stats, teams, tid;

            abbrev = typeof req.params.abbrev !== "undefined" ? req.params.abbrev : undefined;
            [tid, abbrev] = helpers.validateAbbrev(abbrev);
            season = typeof req.params.season !== "undefined" ? req.params.season : undefined;
            season = helpers.validateSeason(season);
            seasons = helpers.getSeasons(season);
            teams = helpers.getTeams(tid);

            sortable = false;

            // Run after players are loaded
            function cb(players) {
                g.dbl.transaction(["teams"]).objectStore("teams").get(tid).onsuccess = function (event) {
                    var data, j, team, teamAll, teamSeason, template;

                    teamAll = event.target.result;
                    for (j = 0; j < teamAll.seasons.length; j++) {
                        if (teamAll.seasons[j].season === season) {
                            teamSeason = teamAll.seasons[j];
                            break;
                        }
                    }
                    team = {region: teamAll.region, name: teamAll.name, cash: teamSeason.cash / 1000000};

                    data = {title: "Roster - League " + g.lid};
                    template = Handlebars.templates.roster;
                    data.league_content = template({g: g, teams: teams, seasons: seasons, sortable: sortable, currentSeason: currentSeason, showTradeFor: currentSeason && tid !== g.userTid, players: players, numRosterSpots: 15 - players.length, team: team});
                    bbgm.ajaxUpdate(data);
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
                g.dbl.transaction(["schedule"]).objectStore("schedule").getAll().onsuccess = function (event) {
                    var i, numGamesRemaining, schedule;

                    // numGamesRemaining doesn't need to be calculated except for g.userTid, but it is.
                    schedule = event.target.result;
                    numGamesRemaining = 0;
                    for (i = 0; i < schedule.length; i++) {
                        if (tid === schedule[i].homeTid || tid === schedule[i].awayTid) {
                            numGamesRemaining += 1;
                        }
                    }

                    g.dbl.transaction(["players"]).objectStore("players").index("tid").getAll(tid).onsuccess = function (event) {
                        var players;

                        players = db.getPlayers(event.target.result, season, tid, attributes, stats, ratings, {numGamesRemaining: numGamesRemaining, showRookies: true, sortBy: "rosterOrder", showNoStats: true});
                        cb(players);
                    };
                };
            } else {
                // Show all players with stats for the given team and year
                currentSeason = false;
                g.dbl.transaction(["players"]).objectStore("players").index("statsTids").getAll(tid).onsuccess = function (event) {
                    var players;

                    players = db.getPlayers(event.target.result, season, tid, attributes, stats, ratings, {numGamesRemaining: 0, showRookies: true, sortBy: "rosterOrder"});
                    cb(players);
                };
            }
        });
    }

    function schedule(req) {
        beforeLeague(req, function () {
            season.getSchedule(0, function (schedule_) {
                var data, game, games, i, row, team0, team1, template, vsat;

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

                data = {title: "Schedule - League " + g.lid};
                template = Handlebars.templates.schedule;
                data.league_content = template({g: g, games: games});
                bbgm.ajaxUpdate(data);
            });
        });
    }

    function free_agents(req) {
        beforeLeague(req, function () {
            if (g.phase >= c.PHASE_AFTER_TRADE_DEADLINE && g.phase <= c.PHASE_RESIGN_PLAYERS) {
                helpers.error("You're not allowed to sign free agents now.");
                return;
            }

            g.dbl.transaction(["players"]).objectStore("players").index("tid").getAll(c.PLAYER_FREE_AGENT).onsuccess = function (event) {
                var attributes, data, players, ratings, stats, template;

                attributes = ["pid", "name", "pos", "age", "contractAmount", "contractExp"];
                ratings = ["ovr", "pot"];
                stats = ["min", "pts", "trb", "ast"];

                players = db.getPlayers(event.target.result, g.season, c.PLAYER_FREE_AGENT, attributes, stats, ratings, {oldStats: true, showNoStats: true});

                data = {title: "Free Agents - League " + g.lid};
                template = Handlebars.templates.freeAgents;
                data.league_content = template({g: g, players: players});
                bbgm.ajaxUpdate(data);
            };
        });
    }

    function draft(req) {
        beforeLeague(req, function () {
            var playerStore, season, seasons;

            season = typeof req.params.season !== "undefined" ? req.params.season : undefined;
            season = helpers.validateSeason(season);

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
                helpers.error("There is no draft history yet. Check back after the draft.");
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
                        var data, drafted, draftAbbrev, draftOrder, draftTid, i, pa, player, playersAll, pr, slot, started, template;

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

                        data = {title: "Draft - League " + g.lid};
                        template = Handlebars.templates.draft;
                        data.league_content = template({g: g, undrafted: undrafted, drafted: drafted, started: started});
                        bbgm.ajaxUpdate(data);
                    };
                };
                return;
            }

            // Show a summary of an old draft
            playerStore.index("draftYear").getAll(season).onsuccess = function (event) {
                var currentAbbrev, currentPr, currentTid, data, draftAbbrev, draftPr, draftTid, i, j, pa, player, players, playersAll, ps, template;

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

                data = {title: season + " Draft Results - League " + g.lid};
                template = Handlebars.templates.draftSummary;
                data.league_content = template({g: g, players: players, seasons: seasons});
                bbgm.ajaxUpdate(data);
            };
        });
    }

    function game_log(req) {
        beforeLeague(req, function () {
            var abbrev, data, season, seasons, teams, template, tid;

            abbrev = typeof req.params.abbrev !== "undefined" ? req.params.abbrev : undefined;
            [tid, abbrev] = helpers.validateAbbrev(abbrev);
            season = typeof req.params.season !== "undefined" ? req.params.season : undefined;
            season = helpers.validateSeason(season);
            seasons = helpers.getSeasons(season);
            teams = helpers.getTeams(tid);

            data = {title: "Game Log - League " + g.lid};
            template = Handlebars.templates.gameLog;
            data.league_content = template({g: g, teams: teams, seasons: seasons});
            bbgm.ajaxUpdate(data);
        });
    }

    function playerRatings(req) {
        beforeLeague(req, function () {
            var season, seasons;

            season = typeof req.params.season !== "undefined" ? req.params.season : undefined;
            season = helpers.validateSeason(season);
            seasons = helpers.getSeasons(season);

            g.dbl.transaction(["players"]).objectStore("players").index("tid").getAll(IDBKeyRange.lowerBound(c.PLAYER_RETIRED, true)).onsuccess = function (event) {
                var attributes, data, players, ratings, stats, template;
                attributes = ["pid", "name", "abbrev", "pos", "age"];
                ratings = ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"];
                stats = [];

                players = db.getPlayers(event.target.result, season, null, attributes, stats, ratings);

                data = {title: "Player Ratings - League " + g.lid};
                template = Handlebars.templates.playerRatings;
                data.league_content = template({g: g, players: players, seasons: seasons});
                bbgm.ajaxUpdate(data);
            };
        });
    }

    function playerStats(req) {
        beforeLeague(req, function () {
            var season, seasons;

            season = typeof req.params.season !== "undefined" ? req.params.season : undefined;
            season = helpers.validateSeason(season);
            seasons = helpers.getSeasons(season);

            g.dbl.transaction(["players"]).objectStore("players").index("tid").getAll(IDBKeyRange.lowerBound(c.PLAYER_RETIRED, true)).onsuccess = function (event) {
                var attributes, data, players, ratings, stats, template;
                attributes = ["pid", "name", "abbrev", "pos", "age"];
                ratings = [];
                stats = ["gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts"];

                players = db.getPlayers(event.target.result, season, null, attributes, stats, ratings, {showRookies: true});

                data = {title: "Player Stats - League " + g.lid};
                template = Handlebars.templates.playerStats;
                data.league_content = template({g: g, players: players, seasons: seasons});
                bbgm.ajaxUpdate(data);
            };
        });
    }

    function player_(req) {
        beforeLeague(req, function () {
            var pid;

            pid = typeof req.params.pid !== "undefined" ? parseInt(req.params.pid, 10) : undefined;

            g.dbl.transaction(["players"]).objectStore("players").get(pid).onsuccess = function (event) {
                var attributes, currentRatings, data, player, ratings, stats, template;

                attributes = ["pid", "name", "tid", "abbrev", "teamRegion", "teamName", "pos", "age", "hgtFt", "hgtIn", "weight", "bornYear", "bornLoc", "contractAmount", "contractExp", "draftYear", "draftRound", "draftPick", "draftAbbrev", "face"];
                ratings = ["season", "abbrev", "age", "ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"];
                stats = ["season", "abbrev", "age", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts"];

                player = db.getPlayer(event.target.result, null, null, attributes, stats, ratings);

                currentRatings = player.ratings[player.ratings.length - 1];

                data = {title: player.name + " - League " + g.lid};
                template = Handlebars.templates.player;
                data.league_content = template({g: g, player: player, currentRatings: currentRatings, showTradeFor: player.tid !== g.userTid});
                bbgm.ajaxUpdate(data);
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
                helpers.error("Something bad happened.");
                return;
            }

            // Get all free agents, filter array based on negotiations data, pass to db.getPlayers, augment with contract data from negotiations
            g.dbl.transaction(["players"]).objectStore("players").index("tid").getAll(c.PLAYER_FREE_AGENT).onsuccess = function (event) {
                var attributes, data, i, j, players, playersAll, playersSome, ratings, stats, template;

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

                data = {title: "Resign Players - League " + g.lid};
                template = Handlebars.templates.negotiationList;
                data.league_content = template({g: g, players: players});
                bbgm.ajaxUpdate(data);
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
                    helpers.error("No negotiation with player " + pid + " in progress.");
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
                    var data, j, pa, payroll, player, pr, team, teams, template;

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

                        data = {title: player.name + " - Contract Negotiation - League " + g.lid};
                        template = Handlebars.templates.negotiation;
                        data.league_content = template({g: g, negotiation: negotiation, player: player, salaryCap: g.salaryCap / 1000, team: team, payroll: payroll});
                        bbgm.ajaxUpdate(data);
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
                        contractNegotiation.create(pid, false, cbDisplayNegotiation);
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
        var data, template;

        beforeNonLeague();

        data = {"title": "Error"};
        template = Handlebars.templates.error;
        data.content = template({error: req.params.error});
        bbgm.ajaxUpdate(data);
    }

    /**
     * Display a whole-page error message to the user, while retaining the league menu.
     * 
     * @memberOf views
     * @param {Object} req Object with parameter "params" containing another object with a string representing the error message in the parameter "error" and an integer league ID in "lid".
     */
    function leagueError(req) {
        beforeLeague({params: {lid: req.params.lid}}, function () {
            var data, template;

            data = {"title": "Error - League " + req.params.lid};
            template = Handlebars.templates.error;
            data.league_content = template({error: req.params.error});
            bbgm.ajaxUpdate(data);
        });
    }

    function testSchedule(req) {
        beforeLeague(req, function () {
            var data, getNumDays, template;

            getNumDays = function (tids) {
                var i, numDays, tidsInDay;

                numDays = 0;
                while (tids.length > 0) {
//                    console.log(tids.length);
                    tidsInDay = [];
                    for (i = 0; i < tids.length; i++) {
                        if (tidsInDay.indexOf(tids[i][0]) < 0 && tidsInDay.indexOf(tids[i][1]) < 0) {
                            tidsInDay.push(tids[i][0]);
                            tidsInDay.push(tids[i][1]);
                        } else {
                            break;
                        }
                    }
                    tids = tids.slice(i);
                    numDays += 1;
//                    console.log("i: " + i);
                }
                return numDays;
            };

            season.newSchedule(function (tids) {
                console.log(getNumDays(tids));
            });

            data = {"title": "Test Schedule - League " + req.params.lid};
            template = Handlebars.templates.error;
            data.league_content = "Test Schedule";
            bbgm.ajaxUpdate(data);
        });
    }

    return {
        init_db: init_db,

        dashboard: dashboard,
        new_league: new_league,
        delete_league: delete_league,

        league_dashboard: league_dashboard,
        standings: standings,
        playoffs: playoffs,
        finances: finances,
        history: history,
        roster: roster,
        schedule: schedule,
        free_agents: free_agents,
        draft: draft,
        game_log: game_log,
        playerRatings: playerRatings,
        playerStats: playerStats,
        player: player_,
        negotiationList: negotiationList,
        negotiation: negotiation,

        globalError: globalError,
        leagueError: leagueError,

        testSchedule: testSchedule
    };
});