define(["g", "db", "core/game", "core/league", "util/playMenu"], function(g, db, game, league, playMenu) {
console.log(game);
    /*Validate that the given abbreviation corresponds to a valid team.

    If an invalid abbreviation is passed, the user's team will be used.

    Args:
        abbrev: Three-letter all-caps string containing a team's
            abbreviation.
    Returns:
        A two element list of the validated team ID and abbreviation.
    */
    function validateAbbrev(abbrev) {
        var tid = null;

        // Try to use the supplied abbrev
        if (abbrev) {
//        r = g.dbex('SELECT tid FROM team_attributes WHERE season = :season AND abbrev = :abbrev', season=g.season, abbrev=abbrev)
//        if r.rowcount == 1:
//            tid, = r.fetchone()
        }

        // If no valid abbrev was given, default to the user's team
        if (!tid) {
            tid = g.userTid;
//        r = g.dbex('SELECT abbrev FROM team_attributes WHERE season = :season AND tid = :tid', season=g.season, tid=tid)
//        abbrev, = r.fetchone()
        }
abbrev = 'ATL';
        return [tid, abbrev];
    }

    /*Validate that the given season is valid.

    A valid season is the current season or one of the past seasons. If an
    invalid season is passed, the current will be used.

    Args:
        season: An integer containing the year of the season.
    Returns:
        An integer containing the argument, if valid, or the year of the current
        season.
    */
    function validateSeason(season) {
        if (!season) {
            season = g.season
        }
        else {
            // Make sure there is an entry for the supplied season in the DB somewhere
            season = parseInt(season, 10);
        }

        return season;
    }

    function beforeLeague(req, cb) {
        g.lid = parseInt(req.params.lid, 10);
g.season = 2012;
g.userTid = 4;

        // Make sure league exists

        // Connect to league database
        request = db.connect_league(g.lid);
        request.onsuccess = function (event) {
            g.dbl = request.result;
            g.dbl.onerror = function (event) {
                console.log("League database error: " + event.target.errorCode);
console.log(event);
            };

            cb();
        }

        // Make sure league template FOR THE CURRENT LEAGUE is showing
        var leagueMenu = document.getElementById("league_menu");
        if (leagueMenu === null || leagueMenu.dataset["lid"] != g.lid) {
            data = {};
            var template = Handlebars.templates['league_layout'];
            data["content"] = template({g: g});
            ajax_update(data);

            // Update play menu
            playMenu.setStatus()
            playMenu.setPhase()
            playMenu.refreshOptions()
        }
    }

    return {
        init_db: function () {
            var data = {"title": "Initialize Database"};
            var url = "/init_db";

            data["content"] = "Resetting databases..."

            // Delete any current league databases
            console.log("Delete any current league databases...");
            if (g.dbl !== undefined) {
                g.dbl.close();
            }
            db.getAll(g.dbm, "leagues", function (leagues) {
                for (var i=0; i<leagues.length; i++) {
                    indexedDB.deleteDatabase("league" + leagues[i]["lid"]);
                }
            });

            // Delete any current meta database
            console.log("Delete any current meta database...");
            g.dbm.close();
            indexedDB.deleteDatabase("meta");

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

            ajax_update(data, url);
        },

        dashboard: function () {
            var data = {"title": "Dashboard"};
            var url = "/";

            db.getAll(g.dbm, "leagues", function (leagues) {
                var template = Handlebars.templates['dashboard'];
                data["content"] = template({leagues: leagues});

                ajax_update(data, url);
            });
        },

        new_league: function (req) {
            var data = {"title": "Create New League"};
            var url = "/new_league";

            if (req.method === "get") {
                db.getAll(g.dbm, "teams", function (teams) {
                    var template = Handlebars.templates['new_league'];
                    data["content"] = template({teams: teams});

                    ajax_update(data, url);
                });
            }
            else if (req.method === "post") {
                tid = parseInt(req.params["tid"], 10);
console.log("New tid: " + tid);
                if (tid >= 0 && tid <= 29) {
                    league.new(tid);
                }
            }
        },

        delete_league: function (req) {
            lid = parseInt(req.params['lid'], 10);
            league.delete(lid)
            req.redirect('/');
        },

        league_dashboard: function (req) {
console.log(this);
            beforeLeague(req, function() {
                var data = {"title": "Dashboard - League " + g.lid};
                var url = "/l/" + g.lid;

                var template = Handlebars.templates['league_dashboard'];
                data["league_content"] = template({g: g});

                ajax_update(data, url);
            });
        },

        game_log: function(req) {
            beforeLeague(req, function() {
                var viewSeason = typeof req.params.viewSeason !== "undefined" ? req.params.viewSeason : undefined;
                viewSeason = validateSeason(viewSeason);
                var viewAbbrev = typeof req.params.viewAbbrev !== "undefined" ? req.params.viewAbbrev : undefined;
                [viewTid, viewAbbrev] = validateAbbrev(viewAbbrev)

                var data = {"title": "Game Log - League " + g.lid};
                var url = "/l/" + g.lid + "/game_log";

                var seasons = [{season: 2012, selected: true}, {season: 2013, selected: false}, {season: 2014, selected: false}];
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

                    ajax_update(data, url);
                };

            });
        }


    };
});
