define(["bbgm", "db", "core/game", "core/league", "core/season", "util/helpers", "util/playMenu"], function(bbgm, db, game, league, season, helpers, playMenu) {
    function beforeLeague(req, cb) {
        g.lid = parseInt(req.params.lid, 10);
        helpers.loadGameAttributes();

        // Make sure league exists

        // Connect to league database
        request = db.connect_league(g.lid);
        request.onsuccess = function (event) {
            g.dbl = request.result;
            g.dbl.onerror = function (event) {
                console.log("League database error: " + event.target.errorCode);
            };

            cb();
        }

        // Make sure league template FOR THE CURRENT LEAGUE is showing
        var leagueMenu = document.getElementById("league_menu");
        if (leagueMenu === null || leagueMenu.dataset["lid"] != g.lid) {
            data = {};
            var template = Handlebars.templates['league_layout'];
            data["content"] = template({g: g});
            bbgm.ajaxUpdate(data);

            // Update play menu
            playMenu.setStatus()
            playMenu.setPhase()
            playMenu.refreshOptions()
        }
    }

    function beforeNonLeague() {
        document.getElementById("playButton").innerHTML = '';
        document.getElementById("playPhase").innerHTML = '';
        document.getElementById("playStatus").innerHTML = '';
    }

    function init_db(req) {
        var data = {"title": "Initialize Database"};

        beforeNonLeague();

        data["content"] = "Resetting databases..."

        // Delete any current league databases
        console.log("Delete any current league databases...");
        if (g.dbl !== undefined) {
            g.dbl.close();
        }
        db.getAll(g.dbm, "leagues", function (leagues) {
            for (var i=0; i<leagues.length; i++) {
                g.indexedDB.deleteDatabase("league" + leagues[i]["lid"]);
                localStorage.removeItem("league" + g.lid + "GameAttributes");
                localStorage.removeItem("league" + g.lid + "DraftOrder");
            }
        });

        // Delete any current meta database
        console.log("Delete any current meta database...");
        g.dbm.close();
        g.indexedDB.deleteDatabase("meta");

        // Create new meta database
        console.log("Create new meta database...");
        request = db.connect_meta();
        request.onsuccess = function(event) {
            g.dbm = request.result;
            g.dbm.onerror = function(event) {
                console.log("Meta database error: " + event.target.errorCode);
            };
        };

        console.log("Done!");

        bbgm.ajaxUpdate(data);
    }

    function dashboard(req) {
        var data = {"title": "Dashboard"};

        beforeNonLeague();

        db.getAll(g.dbm, "leagues", function (leagues) {
            var template = Handlebars.templates['dashboard'];
            data["content"] = template({leagues: leagues});

            bbgm.ajaxUpdate(data);
        });
    }

    function new_league(req) {
        var data = {"title": "Create New League"};

        beforeNonLeague();

        if (req.method === "get") {
            db.getAll(g.dbm, "teams", function (teams) {
                var template = Handlebars.templates['new_league'];
                data["content"] = template({teams: teams});

                bbgm.ajaxUpdate(data);
            });
        }
        else if (req.method === "post") {
            tid = parseInt(req.params["tid"], 10);
            if (tid >= 0 && tid <= 29) {
                league.new(tid);
            }
        }
    }

    function delete_league(req) {
        lid = parseInt(req.params['lid'], 10);
        league.delete(lid);
        req.redirect('/');
    }

    function league_dashboard(req) {
        beforeLeague(req, function() {
            var data = {"title": "Dashboard - League " + g.lid};

            var template = Handlebars.templates["league_dashboard"];
            data["league_content"] = template({g: g});

            bbgm.ajaxUpdate(data);
        });
    }

    function standings(req) {
        beforeLeague(req, function() {
            var data = {"title": "Standings - League " + g.lid};

            var season = typeof req.params.season !== "undefined" ? req.params.season : undefined;
            season = helpers.validateSeason(season);
            var seasons = helpers.getSeasons(season);

            g.dbl.transaction(["teams"]).objectStore("teams").index("season").getAll(season).onsuccess = function (event) {
                var teamsAll = event.target.result;
                teamsAll.sort(function (a, b) {  return b.won/(b.won+b.lost) - a.won/(a.won+a.lost); }); // Sort by winning percentage, descending
                var teams = [];
                var keys = ["tid", "cid", "did", "abbrev", "region", "name", "won", "lost", "wonDiv", "lostDiv", "wonConf", "lostConf"];  // Attributes to keep from teamStore
                for (var i=0; i<teamsAll.length; i++) {
                    teams[i] = {};
                    for (var j=0; j<keys.length; j++) {
                        teams[i][keys[j]] = teamsAll[i][keys[j]];
                    }
                    teams[i].winp = 0
                    if (teams[i].won + teams[i].lost > 0) {
                        teams[i].winp = teams[i].won / (teams[i].won + teams[i].lost);
                    }
                }

                var confs = []
                for (var i=0; i<g.confs.length; i++) {
                    var confTeams = [];
                    for (var k=0; k<teams.length; k++) {
                        if (g.confs[i].cid == teams[k].cid) {
                            confTeams.push(teams[k]);
                        }
                    }

                    confs.push({name: g.confs[i].name, divs: [], teams: confTeams});

                    for (var j=0; j<g.divs.length; j++) {
                        if (g.divs[j].cid == g.confs[i].cid) {
                            var divTeams = [];
                            for (var k=0; k<teams.length; k++) {
                                if (g.divs[j].did == teams[k].did) {
                                    divTeams.push(teams[k]);
                                }
                            }

                            confs[i].divs.push({name: g.divs[j].name, teams: divTeams});
                        }
                    }
                }

                var template = Handlebars.templates["standings"];
                data["league_content"] = template({g: g, confs: confs, seasons: seasons, season: season});

                bbgm.ajaxUpdate(data);
            };
        });
    }

    function playoffs(req) {
        beforeLeague(req, function() {
            var data = {"title": "Playoffs - League " + g.lid};

            var season = typeof req.params.season !== "undefined" ? req.params.season : undefined;
            season = helpers.validateSeason(season);
            var seasons = helpers.getSeasons(season);

            function cb(finalMatchups, series) {
                var template = Handlebars.templates["playoffs"];
                data["league_content"] = template({g: g, finalMatchups: finalMatchups, series: series, seasons: seasons, season: season});

                bbgm.ajaxUpdate(data);
            }

            // In the current season, before playoffs start, display projected matchups
            if (season == g.season && g.phase < c.PHASE_PLAYOFFS) {
                finalMatchups = false;
                g.dbl.transaction(["teams"]).objectStore("teams").index("season").getAll(season).onsuccess = function (event) {
                    var teamsAll = event.target.result;
                    teamsAll.sort(function (a, b) {  return b.won/(b.won+b.lost) - a.won/(a.won+a.lost); }); // Sort by winning percentage, descending
                    var teams = [];
                    var keys = ["tid", "abbrev", "name", "cid"];  // Attributes to keep from teamStore
                    for (var i=0; i<teamsAll.length; i++) {
                        teams[i] = {};
                        for (var j=0; j<keys.length; j++) {
                            teams[i][keys[j]] = teamsAll[i][keys[j]];
                        }
                    }

                    var series = [[], [], [], []];  // First round, second round, third round, fourth round
                    for (var cid=0; cid<2; cid++) {
                        teamsConf = []
                        for (var i=0; i<teams.length; i++) {
                            if (teams[i].cid == cid) {
                                teamsConf.push(teams[i]);
                            }
                        }
                        series[0][0+cid*4] = {home: teamsConf[0], away: teamsConf[7]};
                        series[0][0+cid*4].home.seed = 1;
                        series[0][0+cid*4].away.seed = 8;
                        series[0][1+cid*4] = {home: teamsConf[1], away: teamsConf[6]};
                        series[0][1+cid*4].home.seed = 2;
                        series[0][1+cid*4].away.seed = 7;
                        series[0][2+cid*4] = {home: teamsConf[2], away: teamsConf[5]};
                        series[0][2+cid*4].home.seed = 3;
                        series[0][2+cid*4].away.seed = 6;
                        series[0][3+cid*4] = {home: teamsConf[3], away: teamsConf[4]};
                        series[0][3+cid*4].home.seed = 4;
                        series[0][3+cid*4].away.seed = 5;
                    }

                    cb(finalMatchups, series);
                };
            }
            // Display the current or archived playoffs
            else {
                finalMatchups = true;
                g.dbl.transaction(["playoffSeries"]).objectStore("playoffSeries").get(season).onsuccess = function (event) {
                    var playoffSeries = event.target.result;
console.log(playoffSeries);
                    var series = playoffSeries.series;

// Loop through and set wonSeries based on number of wins

                    cb(finalMatchups, series);
                };
            }
        });
    }

    function roster(req) {
        beforeLeague(req, function() {
            var data = {"title": "Roster - League " + g.lid};

            var abbrev = typeof req.params.abbrev !== "undefined" ? req.params.abbrev : undefined;
            [tid, abbrev] = helpers.validateAbbrev(abbrev);
            var season = typeof req.params.season !== "undefined" ? req.params.season : undefined;
            season = helpers.validateSeason(season);
            var seasons = helpers.getSeasons(season);
            var teams = helpers.getTeams(tid);

            var sortable = false;

            // Run after players are loaded
            function cb(players) {
                g.dbl.transaction(["teams"]).objectStore("teams").index("tid").getAll(tid).onsuccess = function(event) {
                    var teamSeasons = event.target.result;
                    for (var j=0; j<teamSeasons.length; j++) {
                        if (teamSeasons[j]['season'] == g.season) {
                            var teamAll = teamSeasons[j];
                            break;
                        }
                    }
                    var team = {region: teamAll.region, name: teamAll.name, cash: teamAll.cash / 1000000};
                    var template = Handlebars.templates["roster"];
                    data["league_content"] = template({g: g, teams: teams, seasons: seasons, sortable: sortable, currentSeason: currentSeason, showTradeFor: currentSeason && tid != g.userTid, players: players, numRosterSpots: 15 - players.length, team: team});

                    bbgm.ajaxUpdate(data);
                };
            }

            // Show players currently on the roster
            if (season == g.season) {
                var currentSeason = true;

                if (tid == g.userTid) {
                    var sortable = true;
                }
                g.dbl.transaction(["schedule"]).objectStore("schedule").getAll().onsuccess = function(event) {
                    // numGamesRemaining doesn't need to be calculated except for g.userTid, but it is.
                    var schedule = event.target.result;
                    var numGamesRemaining = 0;
                    for (var i=0; i<schedule.length; i++) {
                        if (tid == schedule[i].homeTid || tid == schedule[i].awayTid) {
                            numGamesRemaining += 1;
                        }
                    }
/*        pr.ovr, pr.pot

        AVG(ps.min) as min, AVG(ps.pts) as pts, AVG(ps.orb + ps.drb) as trb, AVG(ps.ast) as ast

        FROM player_attributes as pa LEFT OUTER JOIN player_ratings as pr ON pr.season = :season AND pa.pid = pr.pid LEFT OUTER JOIN player_stats as ps ON ps.season = :season AND ps.playoffs = FALSE AND pa.pid = ps.pid WHERE pa.tid = :tid GROUP BY pa.pid, pr.pid, pr.season ORDER BY pa.roster_order ASC', season=view_season, numGamesRemaining=numGamesRemaining, tid=tid)
                }*/

                    g.dbl.transaction(["players"]).objectStore("players").index("tid").getAll(tid).onsuccess = function(event) {
                        var playersAll = event.target.result;
console.log(playersAll);
                        var players = [];
                        for (var i=0; i<playersAll.length; i++) {
                            var pa = playersAll[i];

                            // Attributes
                            var player = {pid: pa.pid, name: pa.name, pos: pa.pos, age: g.season - pa.bornYear, contractAmount: pa.contractAmount / 1000, contractExp: pa.contractExp, cashOwed: ((1 + pa.contractExp - g.season) * pa.contractAmount - (1 - numGamesRemaining / 82) * pa.contractAmount) / 1000}

                            // Ratings
                            for (var j=0; j<pa.ratings.length; j++) {
                                if (pa.ratings[j].season == season) {
                                    var pr = pa.ratings[j];
                                    break;
                                }
                            }
                            player.ovr = pr.ovr;
                            player.pot = pr.pot;

                            // Stats
                            for (var j=0; j<pa.stats.length; j++) {
                                if (pa.stats[j].season == season && pa.stats[j].playoffs == false) {
                                    var ps = pa.stats[j];
                                    break;
                                }
                            }
                            if (ps.gp > 0) {
                                player.min = ps.min / ps.gp;
                                player.pts = ps.pts / ps.gp;
                                player.trb = ps.trb / ps.gp;
                                player.ast = ps.ast / ps.gp;
                            }
                            else {
                                player.min = 0;
                                player.pts = 0;
                                player.trb = 0;
                                player.ast = 0;
                            }
console.log(ps);

                            players.push(player);
                        }
console.log(players);
                        cb(players);
                    };
                };
            }
            // Show all players with stats for the given team and year
            else {
                var currentSeason = false;
// Write code similar to above, but search based on the stats.tid index
//        r = g.dbex('SELECT pa.pid, pa.name, pa.pos, :season - pa.born_year as age, pr.ovr, pr.pot, pa.contract_amount / 1000 as contract_amount,  pa.contract_exp, AVG(ps.min) as min, AVG(ps.pts) as pts, AVG(ps.orb + ps.drb) as rebounds, AVG(ps.ast) as ast FROM player_attributes as pa LEFT OUTER JOIN player_ratings as pr ON pr.season = :season AND pa.pid = pr.pid LEFT OUTER JOIN player_stats as ps ON ps.season = :season AND ps.playoffs = FALSE AND pa.pid = ps.pid WHERE ps.tid = :tid GROUP BY pa.pid, pr.pid, pr.season ORDER BY pa.roster_order ASC', season=view_season, tid=tid)
            }
        });
    }

    function schedule(req) {
        beforeLeague(req, function() {
            var data = {"title": "Schedule - League " + g.lid};

            season.getSchedule(0, function (schedule_) {
                games = [];
                for (var i=0; i<schedule_.length; i++) {
                    game = schedule_[i];
                    if (g.userTid == game.homeTid || g.userTid == game.awayTid) {
                        var team0 = {tid: game.homeTid, abbrev: game.homeAbbrev, region: game.homeRegion, name: game.homeName};
                        var team1 = {tid: game.awayTid, abbrev: game.awayAbbrev, region: game.awayRegion, name: game.awayName};
                        if (g.userTid == game.homeTid) {
                            var vsat = "vs";
                        }
                        else {
                            var vsat = "at";
                        }
                        row = {teams: [team0, team1], vsat: vsat};
                        games.push(row);
                    }
                }

                var template = Handlebars.templates["schedule"];
                data["league_content"] = template({g: g, games: games});
                bbgm.ajaxUpdate(data);
            });

        });
    }

    function game_log(req) {
        beforeLeague(req, function() {
            var data = {"title": "Game Log - League " + g.lid};

            var abbrev = typeof req.params.abbrev !== "undefined" ? req.params.abbrev : undefined;
            [tid, abbrev] = helpers.validateAbbrev(abbrev);
            var season = typeof req.params.season !== "undefined" ? req.params.season : undefined;
            season = helpers.validateSeason(season);
            var seasons = helpers.getSeasons(season);
            var teams = helpers.getTeams(tid);

            var template = Handlebars.templates['game_log'];
            data["league_content"] = template({g: g, teams: teams, seasons: seasons});

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
        roster: roster,
        schedule: schedule,
        game_log: game_log
    };
});
