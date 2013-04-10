define(["globals", "ui", "lib/handlebars.runtime", "lib/jquery", "lib/underscore", "util/helpers", "util/viewHelpers"], function (g, ui, Handlebars, $, _, helpers, viewHelpers) {
    "use strict";

    function gameLogList(abbrev, season, gid, prevMaxGid, cb) {
        var games, out, tid;

        out = helpers.validateAbbrev(abbrev);
        tid = out[0];
        abbrev = out[1];
        season = helpers.validateSeason(season);

        games = [];
        // This could be made much faster by using a compound index to search for season + team, but that's not supported by IE 10
        g.dbl.transaction(["games"]).objectStore("games").index("season").openCursor(season, "prev").onsuccess = function (event) {
            var content, cursor, game, maxGid, overtime;

            cursor = event.target.result;
            if (cursor && cursor.value.gid > prevMaxGid) {
                game = cursor.value;

                if (game.overtimes === 1) {
                    overtime = " (OT)";
                } else if (game.overtimes > 1) {
                    overtime = " (" + game.overtimes + "OT)";
                } else {
                    overtime = "";
                }

                // Check tid
                if (game.teams[0].tid === tid) {
                    games.push({
                        gid: game.gid,
                        home: true,
                        pts: game.teams[0].pts,
                        oppPts: game.teams[1].pts,
                        oppAbbrev: helpers.getAbbrev(game.teams[1].tid),
                        won: game.teams[0].pts > game.teams[1].pts,
                        selected: game.gid === gid,
                        overtime: overtime
                    });
                } else if (game.teams[1].tid === tid) {
                    games.push({
                        gid: game.gid,
                        home: false,
                        pts: game.teams[1].pts,
                        oppPts: game.teams[0].pts,
                        oppAbbrev: helpers.getAbbrev(game.teams[0].tid),
                        won: game.teams[1].pts > game.teams[0].pts,
                        selected: game.gid === gid,
                        overtime: overtime
                    });
                }

                cursor.continue();
            } else {
                content = Handlebars.templates.gameLogList({lid: g.lid, abbrev: abbrev, games: games, season: season});
                maxGid = games.length > 0 ? games[0].gid : -1;
console.log(games.length + " games")
                cb(content, maxGid);
            }
        };
    }

    function updateGameLogList(abbrev, season, gid, updateEvent, cb) {
        var gameLogListEl, gameLogListTbodyEl, maxGid;

        gameLogListEl = document.getElementById("game-log-list");
        gameLogListTbodyEl = gameLogListEl.querySelector("tbody");

        if (abbrev !== gameLogListEl.dataset.abbrev || season !== parseInt(gameLogListEl.dataset.season, 10)) {
console.log("load gameLogList");
            gameLogList(abbrev, season, gid, -1, function (content, maxGid) {
                gameLogListTbodyEl.innerHTML = content;
                gameLogListEl.dataset.abbrev = abbrev;
                gameLogListEl.dataset.season = season;
                gameLogListEl.dataset.maxGid = maxGid;
                cb();
            });
        } else if (updateEvent === "gameSim" && season === g.season) {
console.log("update gameLogList");
            gameLogList(abbrev, season, gid, parseInt(gameLogListEl.dataset.maxGid, 10), function (content, maxGid) {
                gameLogListTbodyEl.innerHTML = content + gameLogListTbodyEl.innerHTML;
                if (maxGid > 0) {
                    // Only update maxGid if there is actually a new value. Will be -1 if the active team didn't play.
                    gameLogListEl.dataset.maxGid = maxGid;
                }
                cb();
            });
        } else {
            cb();
        }
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

    function updateBoxScore(gid, cb) {
        var boxScoreEl;

        boxScoreEl = document.getElementById("box-score");

        if (gid !== parseInt(boxScoreEl.dataset.gid, 10)) {
console.log("load boxScore");
            boxScore(gid, function (content) {
                boxScoreEl.innerHTML = content;
                boxScoreEl.dataset.gid = gid;
                cb();
            });
        } else {
            cb();
        }
    }

    function updateGameLog(abbrev, season, gid, seasons, teams, updateEvent, cb) {
        var cbLoaded, data, leagueContent;

        leagueContent = document.getElementById("league_content");

        cbLoaded = function () {
            ui.dropdown($("#game-log-select-team"), $("#game-log-select-season"), gid);

            // Game log list dynamic highlighting
            $("#game-log-list").on("click", "tbody tr", function (event) {
                $(this).addClass("alert-info").siblings().removeClass("alert-info");
            });

            updateGameLogList(abbrev, season, gid, updateEvent, function () {
                updateBoxScore(gid, function () {
                    if (cb !== undefined) {
                        cb();
                    }
                });
            });
        };


        if (leagueContent.dataset.id !== "gameLog") {
console.log("load gameLog");
            data = {
                container: "league_content",
                template: "gameLog",
                title: "Game Log",
                vars: {teams: teams, seasons: seasons, season: season, abbrev: abbrev}
            };
            ui.update(data, cbLoaded);
        } else {
            cbLoaded();
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

            updateGameLog(abbrev, season, gid, seasons, teams, req.raw.updateEvent, req.raw.cb);
        });
    }

    return {
        get: get
    };
});