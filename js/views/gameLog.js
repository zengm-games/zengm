/**
 * @name views.gameLog
 * @namespace Game log and box score viewing for all seasons and teams.
 */
define(["globals", "ui", "lib/handlebars.runtime", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, Handlebars, $, ko, _, components, bbgmView, helpers, viewHelpers) {
    "use strict";

    /**
     * Generate a game log list.
     *
     * @memberOf views.gameLog
     * @param {string} abbrev Abbrev of the team for the list of games.
     * @param {number} season Season for the list of games.
     * @param {number} gid Integer game ID for the box score (a negative number means no box score), which is used only for highlighting the relevant entry in the list.
     * @param {function(Array.<Object>)} cb Callback whose argument is a list of game objects.
     */
    function gameLogList(abbrev, season, gid, loadedGames, cb) {
        var games, maxGid, out, tid;

        out = helpers.validateAbbrev(abbrev);
        tid = out[0];
        abbrev = out[1];

        if (loadedGames.length > 0) {
            maxGid = loadedGames[0].gid; // Load new games
        } else {
            maxGid = -1; // Load all games
        }

        games = [];
        // This could be made much faster by using a compound index to search for season + team, but that's not supported by IE 10
        g.dbl.transaction("games").objectStore("games").index("season").openCursor(season, "prev").onsuccess = function (event) {
            var content, cursor, game, i, overtime;

            cursor = event.target.result;
            if (cursor && cursor.value.gid > maxGid) {
                game = cursor.value;

                if (game.overtimes === 1) {
                    overtime = " (OT)";
                } else if (game.overtimes > 1) {
                    overtime = " (" + game.overtimes + "OT)";
                } else {
                    overtime = "";
                }

                // Check tid
                if (game.teams[0].tid === tid || game.teams[1].tid === tid) {
                    games.push({
                        gid: game.gid,
                        selected: game.gid === gid,
                        overtime: overtime
//                        url: "/l/" + g.lid + "/game_log/" + vm.abbrev() + "/" + vm.season() + "/" + game.gid
                    });

                    i = games.length - 1;
                    if (game.teams[0].tid === tid) {
                        games[i].home = true;
                        games[i].pts = game.teams[0].pts;
                        games[i].oppPts = game.teams[1].pts;
                        games[i].oppAbbrev = helpers.getAbbrev(game.teams[1].tid);
                        games[i].won = game.teams[0].pts > game.teams[1].pts;
                    } else if (game.teams[1].tid === tid) {
                        games[i].home = false;
                        games[i].pts = game.teams[1].pts;
                        games[i].oppPts = game.teams[0].pts;
                        games[i].oppAbbrev = helpers.getAbbrev(game.teams[0].tid);
                        games[i].won = game.teams[1].pts > game.teams[0].pts;
                    }
                }

                cursor.continue();
            } else {
                cb(games);
            }
        };
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

    function get(req) {
        var inputs, out;

        inputs = {};

        out = helpers.validateAbbrev(req.params.abbrev);
        inputs.abbrev = out[1];
        inputs.season = helpers.validateSeason(req.params.season);
        inputs.gid = req.params.gid !== undefined ? parseInt(req.params.gid, 10) : -1;

        return inputs;
    }

    function InitViewModel(inputs) {
        this.abbrev = ko.observable(inputs.abbrev);
        this.season = ko.observable(inputs.season);
        this.boxScore = {
            gid: ko.observable(),
            html: ko.observable()
        };
        this.gamesList = {
            abbrev: ko.observable(),
            loading: ko.observable(true),
            season: ko.observable(),
            games: ko.observableArray([])
        };
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
    function updateBoxScore(inputs, updateEvents, vm) {
        var deferred, vars;

        deferred = $.Deferred();
        vars = {};

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || inputs.gid !== vm.boxScore.gid()) {
            boxScore(inputs.gid, function (content) {
                vars.boxScore = {
                    html: content,
                    gid: inputs.gid
                };

                deferred.resolve(vars);
            });
            return deferred.promise();
        }
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
    function updateGamesList(inputs, updateEvents, vm) {
        var deferred, vars;

        deferred = $.Deferred();
        vars = {};

        if (updateEvents.indexOf("dbChange") >= 0 || inputs.abbrev !== vm.gamesList.abbrev() || inputs.season !== vm.gamesList.season()) {
            // Load all games in list
            vm.gamesList.loading(true);
            vm.gamesList.games([]);
            gameLogList(inputs.abbrev, inputs.season, inputs.gid, vm.gamesList.games(), function (games) {
                vm.gamesList.games(games);
                vm.gamesList.abbrev(inputs.abbrev);
                vm.gamesList.season(inputs.season);
                vm.gamesList.loading(false);
                deferred.resolve();
            });
            return deferred.promise();
        }
        if (updateEvents.indexOf("gameSim") >= 0 && inputs.season === g.season) {
            // Partial update of only new games
            gameLogList(inputs.abbrev, inputs.season, inputs.gid, vm.gamesList.games(), function (games) {
                var i;
                for (i = games.length - 1; i >= 0; i--) {
                    vm.gamesList.games.unshift(games[i]);
                }
                deferred.resolve();
            });
            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ko.computed(function () {
            ui.title("Game Log - " + vm.season());
        }).extend({throttle: 1});
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("game-log-dropdown", ["teams", "seasons"], [vm.abbrev(), vm.season()], updateEvents, vm.boxScore.gid() >= 0 ? vm.boxScore.gid() : undefined);

        // Game log list dynamic highlighting
        $("#game-log-list").on("click", "tbody tr", function (event) {
            $(this).addClass("alert-info").siblings().removeClass("alert-info");
        });
    }

    return bbgmView.init({
        id: "gameLog",
        get: get,
        InitViewModel: InitViewModel,
        runBefore: [updateBoxScore],
        runWhenever: [updateGamesList],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});