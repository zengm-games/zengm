define(["globals", "ui", "lib/handlebars.runtime", "lib/jquery", "lib/underscore", "util/helpers", "util/viewHelpers"], function (g, ui, Handlebars, $, _, helpers, viewHelpers) {
    "use strict";

    function gameLogList(abbrev, season, gid, cb) {
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

            games.reverse();  // Show most recent games at top

            content = Handlebars.templates.gameLogList({lid: g.lid, abbrev: abbrev, games: games, season: season});
            document.getElementById("game-log-list").innerHTML = content;
            cb();
        };
    }

    function boxScore(gid, cb) {
        if (gid >= 0) {
            g.dbl.transaction(["games"]).objectStore("games").get(gid).onsuccess = function (event) {
                var content, i, game, overtime;

                game = event.target.result;
                for (i = 0; i < game.teams.length; i++) {

                    // Fix the total minutes calculation, which is usually fucked up for some unknown reason
                    game.teams[i].min = 240 + 25 * game.overtimes;

                    // Put injured players at the bottom, then sort by GS and roster position
                    game.teams[i].players.sort(function (a, b) {
                        // This sorts by starters first and minutes second, since .min is always far less than 1000 and gs is either 1 or 0. Then injured players are listed third, since .injury.gamesRemaining is 0 for healthy and -1 for injured.
                        return b.gs * 1000 + b.min + b.injury.gamesRemaining * 1000 > a.gs * 1000 + a.min + a.injury.gamesRemaining * 1000;
                    });

                    game.teams[i].players[4].separator = true;
                    _.last(game.teams[i].players).separator = true;
                }

                if (game.overtimes === 1) {
                    overtime = " (OT)";
                } else if (game.overtimes > 1) {
                    overtime = " (" + game.overtimes + "OT)";
                } else {
                    overtime = "";
                }

                content = Handlebars.templates.boxScore({lid: g.lid, game: game, overtime: overtime});
                cb(content);
            };
        } else {
            cb("<p>Select a game from the menu on the right to view the box score.</p>");
        }
    }

    function updateGameLogList(abbrev, season, gid, cb) {
        var gameLogListEl;

        gameLogListEl = document.getElementById("game-log-list");
        if (abbrev != gameLogListEl.dataset.abbrev || season != parseInt(gameLogListEl.dataset.season, 10)) {
console.log("load gameLogList");
            gameLogListEl.dataset.abbrev = abbrev;
            gameLogListEl.dataset.season = season;
            gameLogList(abbrev, season, gid, cb);
        } else {
console.log("gameLogList already loaded");
            cb();
        }
    }

    function updateBoxScore(gid, cb) {
        var boxScoreEl;

        boxScoreEl = document.getElementById("box-score");

        if (gid !== parseInt(boxScoreEl.dataset.gid, 10)) {
console.log("load boxScore");
            boxScore(gid, function (content) {
                document.getElementById("box-score").innerHTML = content;
                boxScoreEl.dataset.gid = gid;
                cb();
            });
        } else {
console.log("boxScore already loaded");
            cb();
        }
    }

    function updateGameLog(abbrev, season, gid, seasons, teams, cb) {
        var cbLoaded, data, leagueContent;

        leagueContent = document.getElementById("league_content");

        cbLoaded = function () {
            ui.dropdown($("#game-log-select-team"), $("#game-log-select-season"), gid);

            updateGameLogList(abbrev, season, gid, function () {
               updateBoxScore(gid, function () {
                   if (cb !== undefined) {
                       cb();
                   }
               });
           }); 
        };


        if (leagueContent.dataset.id === "gameLog") {
console.log("gameLog already loaded");
            cbLoaded();
        } else {
console.log("load gameLog");
            data = {
                container: "league_content",
                template: "gameLog",
                title: "Game Log",
                vars: {teams: teams, seasons: seasons, season: season, abbrev: abbrev}
            };
            ui.update(data, function () {
                leagueContent.dataset.id = "gameLog";

                cbLoaded();
            });
        }
    }

    function get(req) {
        viewHelpers.beforeLeague(req, function () {
            var abbrev, cbDisplay, gid, out, season, seasons, teams, tid;

            out = helpers.validateAbbrev(req.params.abbrev);
            tid = out[0];
            abbrev = out[1];
            season = helpers.validateSeason(req.params.season);
            seasons = helpers.getSeasons(season);
            teams = helpers.getTeams(tid);
            gid = req.params.gid !== undefined ? parseInt(req.params.gid, 10) : -1;

            updateGameLog(abbrev, season, gid, seasons, teams, req.raw.cb);
        });
    }

    return {
        get: get
    };
});