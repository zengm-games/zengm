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
            var seasons = helpers.getSeasons(season)

            var confs = []
            for (var i=0; i<g.confs.length; i++) {
                confs.push({name: g.confs[i].name, divs: [], teams: []});
                for (var j=0; j<g.divs.length; j++) {
                    if (g.divs[j].cid == g.confs[i].cid) {
                        confs[i].divs.push({name: g.divs[j].name, teams: []});
                    }
                }
            }

/*        r = g.dbex('SELECT * FROM team_attributes as ta WHERE ta.did IN (%s) AND season = :season ORDER BY CASE won + lost WHEN 0 THEN 0 ELSE won / (won + lost) END DESC' % (divisions,), season=view_season)
        confs[-1]['teams'] = r.fetchall()

        r = g.dbex('SELECT did, name FROM divisions WHERE cid = :cid ORDER BY name ASC', cid=cid)
        for did, division_name in r.fetchall():
            r = g.dbex('SELECT * FROM team_attributes WHERE did = :did AND season = :season ORDER BY CASE won + lost WHEN 0 THEN 0 ELSE won / (won + lost) END DESC', did=did, season=view_season)
            confs[-1]['divisions'].append({'name': division_name})
            confs[-1]['divisions'][-1]['teams'] = r.fetchall()*/

            var template = Handlebars.templates["standings"];
            data["league_content"] = template({g: g, confs: confs, seasons: seasons, season: season});

            bbgm.ajaxUpdate(data);
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

            g.dbl.transaction(["teams"]).objectStore("teams").index("season").getAll(viewSeason).onsuccess = function(event) {
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
        schedule: schedule,
        game_log: game_log
    };
});
