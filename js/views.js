define(["bbgm", "db", "core/contractNegotiation", "core/game", "core/league", "core/season", "util/helpers", "util/playMenu"], function (bbgm, db, contractNegotiation, game, league, season, helpers, playMenu) {
    "use strict";

    function beforeLeague(req, cb) {
        var data, leagueMenu, request, template;

        g.lid = parseInt(req.params.lid, 10);
        helpers.loadGameAttributes();

        // Make sure league exists


        // Make sure league template FOR THE CURRENT LEAGUE is showing
        leagueMenu = document.getElementById("league_menu");
        if (leagueMenu === null || parseInt(leagueMenu.dataset.lid, 10) !== g.lid) {
            // Connect to league database
            request = db.connect_league(g.lid);
            request.onsuccess = function (event) {
                g.dbl = request.result;
                g.dbl.onerror = function (event) {
                    console.log("League database error: " + event.target.errorCode);
                };

                cb();
            };

            data = {};
            template = Handlebars.templates.league_layout;
            data.content = template({g: g});
            bbgm.ajaxUpdate(data);

            // Update play menu
            playMenu.setStatus();
            playMenu.setPhase();
            playMenu.refreshOptions();
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
        var data, request;

        beforeNonLeague();

        // Delete any current league databases
        console.log("Delete any current league databases...");
        if (g.dbl !== undefined) {
            g.dbl.close();
        }
        g.dbm.transaction(["leagues"]).objectStore("leagues").getAll().onsuccess = function (event) {
            var i, leagues;

            leagues = event.target.result;

            for (i = 0; i < leagues.length; i++) {
                g.indexedDB.deleteDatabase("league" + leagues[i].lid);
                localStorage.removeItem("league" + leagues[i].lid + "GameAttributes");
                localStorage.removeItem("league" + leagues[i].lid + "DraftOrder");
            }
        };

        // Delete any current meta database
        console.log("Delete any current meta database...");
        g.dbm.close();
        g.indexedDB.deleteDatabase("meta");

        // Create new meta database
        console.log("Create new meta database...");
        request = db.connect_meta();
        request.onsuccess = function (event) {
            g.dbm = request.result;
            g.dbm.onerror = function (event) {
                console.log("Meta database error: " + event.target.errorCode);
            };
        };

        console.log("Done!");

        data = {title: "Initialize Database"};
        data.content = "Resetting databases...";
        bbgm.ajaxUpdate(data);
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
                league.create(tid);
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
            var season, seasons;

            season = typeof req.params.season !== "undefined" ? req.params.season : undefined;
            season = helpers.validateSeason(season);
            seasons = helpers.getSeasons(season);

            g.dbl.transaction(["teams"]).objectStore("teams").index("season").getAll(season).onsuccess = function (event) {
                var confs, confTeams, data, divTeams, i, j, k, keys, teams, teamsAll, template;

                teamsAll = event.target.result;
                teamsAll.sort(function (a, b) {  return (b.won / (b.won + b.lost)) - (a.won / (a.won + a.lost)); }); // Sort by winning percentage, descending
                teams = [];
                keys = ["tid", "cid", "did", "abbrev", "region", "name", "won", "lost", "wonDiv", "lostDiv", "wonConf", "lostConf"];  // Attributes to keep from teamStore
                for (i = 0; i < teamsAll.length; i++) {
                    teams[i] = {};
                    for (j = 0; j < keys.length; j++) {
                        teams[i][keys[j]] = teamsAll[i][keys[j]];
                    }
                    teams[i].winp = 0;
                    if (teams[i].won + teams[i].lost > 0) {
                        teams[i].winp = teams[i].won / (teams[i].won + teams[i].lost);
                    }
                }

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
            };
        });
    }

    function playoffs(req) {
        beforeLeague(req, function () {
            var finalMatchups, season, seasons;

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
                g.dbl.transaction(["teams"]).objectStore("teams").index("season").getAll(season).onsuccess = function (event) {
                    var cid, i, j, keys, series, teams, teamsAll, teamsConf;
                    teamsAll = event.target.result;
                    teamsAll.sort(function (a, b) {  return (b.won / (b.won + b.lost)) - (a.won / (a.won + a.lost)); }); // Sort by winning percentage, descending
                    teams = [];
                    keys = ["tid", "abbrev", "name", "cid"];  // Attributes to keep from teamStore
                    for (i = 0; i < teamsAll.length; i++) {
                        teams[i] = {};
                        for (j = 0; j < keys.length; j++) {
                            teams[i][keys[j]] = teamsAll[i][keys[j]];
                        }
                    }

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
                };
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

    function roster(req) {
        beforeLeague(req, function () {
            var abbrev, currentSeason, season, seasons, sortable, teams, tid;

            abbrev = typeof req.params.abbrev !== "undefined" ? req.params.abbrev : undefined;
            [tid, abbrev] = helpers.validateAbbrev(abbrev);
            season = typeof req.params.season !== "undefined" ? req.params.season : undefined;
            season = helpers.validateSeason(season);
            seasons = helpers.getSeasons(season);
            teams = helpers.getTeams(tid);

            sortable = false;

            // Run after players are loaded
            function cb(players) {
                g.dbl.transaction(["teams"]).objectStore("teams").index("tid").getAll(tid).onsuccess = function (event) {
                    var data, j, team, teamAll, teamSeasons, template;

                    teamSeasons = event.target.result;
                    for (j = 0; j < teamSeasons.length; j++) {
                        if (teamSeasons[j].season === g.season) {
                            teamAll = teamSeasons[j];
                            break;
                        }
                    }
                    team = {region: teamAll.region, name: teamAll.name, cash: teamAll.cash / 1000000};

                    data = {title: "Roster - League " + g.lid};
                    template = Handlebars.templates.roster;
                    data.league_content = template({g: g, teams: teams, seasons: seasons, sortable: sortable, currentSeason: currentSeason, showTradeFor: currentSeason && tid !== g.userTid, players: players, numRosterSpots: 15 - players.length, team: team});
                    bbgm.ajaxUpdate(data);
                };
            }

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
/*        pr.ovr, pr.pot

        AVG(ps.min) as min, AVG(ps.pts) as pts, AVG(ps.orb + ps.drb) as trb, AVG(ps.ast) as ast

        FROM player_attributes as pa LEFT OUTER JOIN player_ratings as pr ON pr.season = :season AND pa.pid = pr.pid LEFT OUTER JOIN player_stats as ps ON ps.season = :season AND ps.playoffs = FALSE AND pa.pid = ps.pid WHERE pa.tid = :tid GROUP BY pa.pid, pr.pid, pr.season ORDER BY pa.roster_order ASC', season=view_season, numGamesRemaining=numGamesRemaining, tid=tid)
                }*/

                    g.dbl.transaction(["players"]).objectStore("players").index("tid").getAll(tid).onsuccess = function (event) {
                        var j, pa, player, players, playersAll, pr, ps;

                        playersAll = event.target.result;
                        players = [];
                        for (i = 0; i < playersAll.length; i++) {
                            pa = playersAll[i];

                            // Attributes
                            player = {pid: pa.pid, name: pa.name, pos: pa.pos, age: g.season - pa.bornYear, contractAmount: pa.contractAmount / 1000, contractExp: pa.contractExp, cashOwed: ((1 + pa.contractExp - g.season) * pa.contractAmount - (1 - numGamesRemaining / 82) * pa.contractAmount) / 1000};

                            // Ratings
                            for (j = 0; j < pa.ratings.length; j++) {
                                if (pa.ratings[j].season === season) {
                                    pr = pa.ratings[j];
                                    break;
                                }
                            }
                            player.ovr = pr.ovr;
                            player.pot = pr.pot;

                            // Stats
                            for (j = 0; j < pa.stats.length; j++) {
                                if (pa.stats[j].season === season && pa.stats[j].playoffs === false) {
                                    ps = pa.stats[j];
                                    break;
                                }
                            }
                            if (ps.gp > 0) {
                                player.min = ps.min / ps.gp;
                                player.pts = ps.pts / ps.gp;
                                player.trb = ps.trb / ps.gp;
                                player.ast = ps.ast / ps.gp;
                            } else {
                                player.min = 0;
                                player.pts = 0;
                                player.trb = 0;
                                player.ast = 0;
                            }

                            players.push(player);
                        }

                        cb(players);
                    };
                };
            } else {
                // Show all players with stats for the given team and year
                currentSeason = false;
// Write code similar to above, but search based on the stats.tid index
//        r = g.dbex('SELECT pa.pid, pa.name, pa.pos, :season - pa.born_year as age, pr.ovr, pr.pot, pa.contract_amount / 1000 as contract_amount,  pa.contract_exp, AVG(ps.min) as min, AVG(ps.pts) as pts, AVG(ps.orb + ps.drb) as rebounds, AVG(ps.ast) as ast FROM player_attributes as pa LEFT OUTER JOIN player_ratings as pr ON pr.season = :season AND pa.pid = pr.pid LEFT OUTER JOIN player_stats as ps ON ps.season = :season AND ps.playoffs = FALSE AND pa.pid = ps.pid WHERE ps.tid = :tid GROUP BY pa.pid, pr.pid, pr.season ORDER BY pa.roster_order ASC', season=view_season, tid=tid)
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
                helpers.leagueError("You're not allowed to sign free agents now.");
                return;
            }

            g.dbl.transaction(["players"]).objectStore("players").index("tid").getAll(c.PLAYER_FREE_AGENT).onsuccess = function (event) {
                var data, i, j, pa, player, players, playersAll, pr, ps, template;

                playersAll = event.target.result;
                players = [];
                for (i = 0; i < playersAll.length; i++) {
                    pa = playersAll[i];

                    // Attributes
                    player = {pid: pa.pid, name: pa.name, pos: pa.pos, age: g.season - pa.bornYear, contractAmount: pa.contractAmount / 1000, contractExp: pa.contractExp};

                    // Ratings
                    for (j = 0; j < pa.ratings.length; j++) {
                        if (pa.ratings[j].season === g.season) {
                            pr = pa.ratings[j];
                            break;
                        }
                    }
                    player.ovr = pr.ovr;
                    player.pot = pr.pot;

                    // Stats
                    for (j = 0; j < pa.stats.length; j++) {
                        if (pa.stats[j].season === g.season && pa.stats[j].playoffs === false) {
                            ps = pa.stats[j];
                            break;
                        }
                    }
                    // Load previous season if no stats this year
                    if (typeof ps === "undefined") {
                        for (j = 0; j < pa.stats.length; j++) {
                            if (pa.stats[j].season === g.season - 1 && pa.stats[j].playoffs === false) {
                                ps = pa.stats[j];
                                break;
                            }
                        }
                    }
                    if (typeof ps !== "undefined" && ps.gp > 0) {
                        player.min = ps.min / ps.gp;
                        player.pts = ps.pts / ps.gp;
                        player.trb = ps.trb / ps.gp;
                        player.ast = ps.ast / ps.gp;
                    } else {
                        player.min = 0;
                        player.pts = 0;
                        player.trb = 0;
                        player.ast = 0;
                    }

                    players.push(player);
                }

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
                seasons = helpers.getSeasons(season, g.season);  // Show this season as an option
            }

            if (g.phase < c.PHASE_DRAFT && season < g.startingSeason) {
                helpers.leagueError("There is no draft history yet. Check back after the season.");
                return;
            }

            // Active draft
            if (g.phase === c.PHASE_DRAFT && season === g.season) {
                playerStore = g.dbl.transaction(["players"]).objectStore("players");
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
                        var data, drafted, draftAbbrev, draftOrder, draftTid, pa, player, playersAll, pr, slot, started, template;

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
/*            data = {title: g.season + " Draft Results - League " + g.lid};

            r = g.dbex("SELECT dr.round, dr.pick, dr.abbrev, dr.pid, dr.name, :viewSeason - dr.bornYear AS age, dr.pos, dr.ovr, dr.pot, ta.abbrev AS currentAbbrev, :season - dr.bornYear AS currentAge, pr.ovr AS currentOvr, pr.pot AS currentPot, SUM(CASE WHEN ps.min > 0 THEN 1 ELSE 0 END) AS gp, AVG(ps.min) as min, AVG(ps.pts) AS pts, AVG(ps.orb + ps.drb) AS trb, AVG(ps.ast) AS ast FROM draftResults AS dr LEFT OUTER JOIN playerRatings AS pr ON pr.season = :season AND dr.pid = pr.pid LEFT OUTER JOIN playerStats AS ps ON ps.playoffs = FALSE AND dr.pid = ps.pid LEFT OUTER JOIN playerAttributes AS pa ON dr.pid = pa.pid LEFT OUTER JOIN teamAttributes AS ta ON pa.tid = ta.tid AND ta.season = :season WHERE dr.season = :viewSeason GROUP BY dr.pid", viewSeason=viewSeason, season=g.season);
            players = r.fetchall();
            return renderAllOrJson("draftSummary.html", {"players": players, "seasons": seasons, "viewSeason": viewSeason});*/
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

    function negotiationList() {
        var negotiations;

        // If there is only one active negotiation with a free agent, go to it;
        negotiations = JSON.parse(localStorage.getItem("league" + g.lid + "Negotiations"));
        if (negotiations.length === 1) {
            Davis.location.assign(new Davis.Request("/l/" + g.lid + "/negotiation/" + negotiations[0].pid));
            return;
        }

/*        if (g.phase !== c.PHASE_RESIGN_PLAYERS) {
            error = "Something bad happened.";
            return renderAllOrJson("leagueError.html", {"error": error});
        }

        r = g.dbex("SELECT pa.pid, pa.name, pa.pos, :season - pa.bornYear as age, pr.ovr, pr.pot, AVG(ps.min) as min, AVG(ps.pts) as pts, AVG(ps.orb + ps.drb) as rebounds, AVG(ps.ast) as ast, pa.contractAmount/1000.0*(1+pa.freeAgentTimesAsked/10) as contractAmount, pa.contractExp FROM playerAttributes as pa LEFT OUTER JOIN negotiations as n ON pa.pid = n.pid LEFT OUTER JOIN playerRatings as pr ON pr.season = :season AND pa.pid = pr.pid LEFT OUTER JOIN playerStats as ps ON ps.season = :season AND ps.playoffs = FALSE AND pa.pid = ps.pid WHERE pa.tid = :tid AND n.resigning = 1 GROUP BY pa.pid", season=g.season, tid=c.PLAYER_FREE_AGENT);

        players = r.fetchall();

        return renderAllOrJson("negotiationList.html", {"players": players});*/
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
                    helpers.leagueError("No negotiation with player " + pid + " in progress.");
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
                    var data, j, pa, payroll, player, pr, salaryCap, team, teams, template;

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

                    salaryCap = g.salaryCap / 1000;

                    teams = helpers.getTeams();
                    team = {region: teams[g.userTid].region, name: teams[g.userTid].name};

                    helpers.getPayroll(g.userTid, function (payroll) {
                        payroll /= 1000;

                        data = {title: player.name + " - Contract Negotiation - League " + g.lid};
                        template = Handlebars.templates.negotiation;
                        data.league_content = template({g: g, negotiation: negotiation, player: player, salaryCap: salaryCap, team: team, payroll: payroll});
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

    return {
        init_db: init_db,

        dashboard: dashboard,
        new_league: new_league,
        delete_league: delete_league,

        league_dashboard: league_dashboard,
        standings: standings,
        playoffs: playoffs,
        roster: roster,
        schedule: schedule,
        free_agents: free_agents,
        draft: draft,
        game_log: game_log,
        negotiationList: negotiationList,
        negotiation: negotiation
    };
});
