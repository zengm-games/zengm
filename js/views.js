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

    function init_db(req) {
        var data = {"title": "Initialize Database"};

        data["content"] = "Resetting databases..."

        // Delete any current league databases
        console.log("Delete any current league databases...");
        if (g.dbl !== undefined) {
            g.dbl.close();
        }
        db.getAll(g.dbm, "leagues", function (leagues) {
            for (var i=0; i<leagues.length; i++) {
                g.indexedDB.deleteDatabase("league" + leagues[i]["lid"]);
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

        db.getAll(g.dbm, "leagues", function (leagues) {
            var template = Handlebars.templates['dashboard'];
            data["content"] = template({leagues: leagues});

            bbgm.ajaxUpdate(data);
        });
    }

    function new_league(req) {
        var data = {"title": "Create New League"};

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
        league.delete(lid)
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
                teams.sort(function (a, b) {  return b.winp - a.winp; }); // Sort by winning percentage

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

            var series = [[], [], [], []];  // First round, second round, third round, fourth round


            g.dbl.transaction(["teams"]).objectStore("teams").index("season").getAll(season).onsuccess = function (event) {
                var teamsAll = event.target.result;
                var teams = [];
                var keys = ["name", "cid", "won", "lost"];  // Attributes to keep from teamStore
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
                teams.sort(function (a, b) {  return b.winp - a.winp; }); // Sort by winning percentage

                // Remove stuff that was just for sorting
                for (var i=0; i<teamsAll.length; i++) {
                    delete teams[i].won;
                    delete teams[i].lost;
                    delete teams[i].winp;
                }

                // In the current season, before playoffs start, display projected matchups
                if (season == g.season && g.phase < c.PHASE_PLAYOFFS) {
                    finalMatchups = false;
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
//                        series[0].push({'seedHome': 1, 'seedAway': 8, 'nameHome': teamsConf[0], 'nameAway': teamsConf[7]});
//                        series[0].push({'seedHome': 2, 'seedAway': 7, 'nameHome': teamsConf[1], 'nameAway': teamsConf[6]});
//                        series[0].push({'seedHome': 3, 'seedAway': 6, 'nameHome': teamsConf[2], 'nameAway': teamsConf[5]});
//                        series[0].push({'seedHome': 4, 'seedAway': 5, 'nameHome': teamsConf[3], 'nameAway': teamsConf[4]});
                    }
                }
                // Display the current or archived playoffs
                else {
                    finalMatchups = true;
/*                    r = g.dbex('SELECT sid, round, (SELECT name FROM team_attributes WHERE tid = aps.tid_home AND season = :season) as name_home, (SELECT name FROM team_attributes WHERE tid = aps.tid_away AND season = :season) as name_away, seed_home, seed_away, won_home, won_away FROM playoff_series as aps WHERE season = :season ORDER BY round, sid ASC', season=view_season)
                    for s in r.fetchall():
                        series[s['round'] - 1].push(s)*/
                }

                var template = Handlebars.templates["playoffs"];
                data["league_content"] = template({g: g, finalMatchups: finalMatchups, series: series, seasons: seasons, season: season});

                bbgm.ajaxUpdate(data);
            };
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

            var viewAbbrev = typeof req.params.viewAbbrev !== "undefined" ? req.params.viewAbbrev : undefined;
            [viewTid, viewAbbrev] = helpers.validateAbbrev(viewAbbrev);
            var viewSeason = typeof req.params.viewSeason !== "undefined" ? req.params.viewSeason : undefined;
            viewSeason = helpers.validateSeason(viewSeason);
            var seasons = helpers.getSeasons(viewSeason);

            g.dbl.transaction(["teams"]).objectStore("teams").index("season").getAll(viewSeason).onsuccess = function (event) {
                var teamsAll = event.target.result;
                var teams = [];
                for (var i=0; i<teamsAll.length; i++) {
                    var team = teamsAll[i];

                    if (team.tid == viewTid) {
                        var selected = true;
                    }
                    else {
                        var selected = false;
                    }

                    teams.push({tid: team.tid, abbrev: team.abbrev, region: team.region, name: team.name, selected: selected});
                }
                var template = Handlebars.templates['game_log'];
                data["league_content"] = template({g: g, teams: teams, seasons: seasons});

                bbgm.ajaxUpdate(data);
            };

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
        schedule: schedule,
        game_log: game_log
    };
});
