/**
 * @name views.gameLog
 * @namespace Game log and box score viewing for all seasons and teams.
 */
define(["globals", "ui", "lib/handlebars.runtime", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/helpers", "util/viewHelpers"], function (g, ui, Handlebars, $, ko, _, components, helpers, viewHelpers) {
    "use strict";

    var vm;

    /**
     * Generate a game log list.
     *
     * @memberOf views.gameLog
     * @param {string} abbrev Abbrev of the team for the list of games.
     * @param {number} season Season for the list of games.
     * @param {number} gid Integer game ID for the box score (a negative number means no box score), which is used only for highlighting the relevant entry in the list.
     * @param {number} prevMaxGid Integer game ID for the previous most recent entry in the list. Only games with larger IDs will be returned, so set to -1 to return all games.
     * @param {function()} cb Callback.
     */
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
                cb(content, maxGid);
            }
        };
    }

    /**
     * Update the game log list, as necessary.
     *
     * If the game log list is already loaded, nothing is done. If the game log list is loaded and a new game has been played, update. If the game log list is not loaded, load it.
     *
     * @memberOf views.gameLog
     * @param {string} abbrev Abbrev of the team for the list of games.
     * @param {number} season Season for the list of games.
     * @param {number} gid Integer game ID for the box score (a negative number means no box score), which is used only for highlighting the relevant entry in the list.
     * @param {Array.<string>} updateEvents Information about what caused this update, e.g. "gameSim" or "newPhase". Empty on normal page loads (i.e. from clicking a link).
     * @param {function()} cb Callback.
     */
    function updateGameLogList(abbrev, season, gid, updateEvents, cb) {
        var gameLogListEl, gameLogListTbodyEl, maxGid;

        gameLogListEl = document.getElementById("game-log-list");
        gameLogListTbodyEl = gameLogListEl.querySelector("tbody");

        if (abbrev !== vm.gamesList.abbrev() || season !== vm.gamesList.season()) {
            gameLogListTbodyEl.innerHTML = '<tr><td colspan="3" style="padding: 4px 5px;">Loading...</td></tr>';
            gameLogList(abbrev, season, gid, -1, function (content, maxGid) {
                gameLogListTbodyEl.innerHTML = content;
                vm.gamesList.abbrev(abbrev);
                vm.gamesList.season(season);
                gameLogListEl.dataset.maxGid = maxGid;
                cb();
            });
        } else if (updateEvents.indexOf("gameSim") >= 0 && season === g.season) {
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


    /**
     * Generate a box score.
     *
     * @memberOf views.gameLog
     * @param {number} gid Integer game ID for the box score (a negative number means no box score).
     * @param {function(string)} cb Callback whose argument is a string of HTML containing either the box score or a placeholder.
     */
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

    /**
     * Update the displayed box score, as necessary.
     *
     * If the box score is already loaded, nothing is done.
     *
     * @memberOf views.gameLog
     * @param {number} gid Integer game ID for the box score (a negative number means no box score).
     * @param {function()} cb Callback.
     */
    function updateBoxScore(gid, cb) {
        if (gid !== vm.boxScore.gid()) {
            boxScore(gid, function (content) {
                vm.boxScore.html(content);
                vm.boxScore.gid(gid);
                cb();
            });
        } else {
            cb();
        }
    }

    /**
     * Update the game log view, as necessary.
     *
     * If the game log view is not loaded yet, this will load it.
     *
     * @memberOf views.gameLog
     * @param {string} abbrev Abbrev of the team for the list of games.
     * @param {number} season Season for the list of games.
     * @param {number} gid Integer game ID for the box score (a negative number means no box score).
     * @param {Array.<string>} updateEvents Information about what caused this update, e.g. "gameSim" or "newPhase". Empty on normal page loads (i.e. from clicking a link).
     * @param {function()=} cb Optional callback.
     */
    function update(abbrev, season, gid, updateEvents, cb) {
        var cbLoaded, data, leagueContent;

        leagueContent = document.getElementById("league_content");

        cbLoaded = function () {
            components.dropdown("game-log-dropdown", ["teams", "seasons"], [abbrev, season], updateEvents, gid >= 0 ? gid : undefined);

            // Game log list dynamic highlighting
            $("#game-log-list").on("click", "tbody tr", function (event) {
                $(this).addClass("alert-info").siblings().removeClass("alert-info");
            });

            updateBoxScore(gid, function () {
                updateGameLogList(abbrev, season, gid, updateEvents, function () {
                    if (cb !== undefined) {
                        cb();
                    }
                });
            });
        };


        if (leagueContent.dataset.id !== "gameLog") {
            data = {
                container: "league_content",
                template: "gameLog",
                title: "Game Log",
                vars: {}
            };
            ui.update(data);

            vm = (new function () {
                this.abbrev = ko.observable(abbrev);
                this.season = ko.observable(season);

                this.boxScore = {
                    gid: ko.observable(),
                    html: ko.observable()
                };

                this.gamesList = {
                    abbrev: ko.observable(),
                    season: ko.observable()
                };

                this.rosterUrl = ko.computed(function () {
                    return "/l/" + g.lid + "/roster/" + this.abbrev() + "/" + this.season();
                }, this);
                this.financesUrl = ko.computed(function () {
                    return "/l/" + g.lid + "/team_finances/" + this.abbrev();
                }, this);
            }());
            ko.applyBindings(vm);

            cbLoaded();
        } else {
            vm.abbrev(abbrev);
            vm.season(season);
            cbLoaded();
        }
    }

    /**
     * Respond to GET requests for the game log.
     *
     * @memberOf views.gameLog
     * @param {Object} req Davis.js request object.
     */
    function get(req) {
        viewHelpers.beforeLeague(req, function () {
            var abbrev, cbDisplay, gid, out, season, seasons, teams, tid, updateEvents;

            out = helpers.validateAbbrev(req.params.abbrev);
            tid = out[0];
            abbrev = out[1];
            season = helpers.validateSeason(req.params.season);
            gid = req.params.gid !== undefined ? parseInt(req.params.gid, 10) : -1;
            updateEvents = req.raw.updateEvents !== undefined ? req.raw.updateEvents : [];

            update(abbrev, season, gid, updateEvents, req.raw.cb);
        });
    }

    return {
        update: update,
        get: get
    };
});