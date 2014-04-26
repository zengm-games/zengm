/**
 * @name views.gameLog
 * @namespace Game log and box score viewing for all seasons and teams.
 */
define(["globals", "ui", "lib/jquery", "lib/knockout", "lib/knockout.mapping", "lib/underscore", "views/components", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, $, ko, komapping, _, components, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    /**
     * Generate a box score.
     *
     * @memberOf views.gameLog
     * @param {number} gid Integer game ID for the box score (a negative number means no box score).
     * @param {function(Object)} cb Callback whose argument is an object containing the box score data (or a blank object).
     */
    function boxScore(gid, cb) {
        if (gid >= 0) {
            g.dbl.transaction("games").objectStore("games").get(gid).onsuccess = function (event) {
                var i, game;

                game = event.target.result;
                for (i = 0; i < game.teams.length; i++) {
                    // Team metadata
                    game.teams[i].abbrev = g.teamAbbrevsCache[game.teams[i].tid];
                    game.teams[i].region = g.teamRegionsCache[game.teams[i].tid];
                    game.teams[i].name = g.teamNamesCache[game.teams[i].tid];

                    // Fix the total minutes calculation, which is usually fucked up for some unknown reason
                    game.teams[i].min = 240 + 25 * game.overtimes;

                    // Put injured players at the bottom, then sort by GS and roster position
                    game.teams[i].players.sort(function (a, b) {
                        // This sorts by starters first and minutes second, since .min is always far less than 1000 and gs is either 1 or 0. Then injured players are listed third, since .injury.gamesRemaining is 0 for healthy and -1 for injured.
                        return (b.gs * 1000 + b.min + b.injury.gamesRemaining * 1000) - (a.gs * 1000 + a.min + a.injury.gamesRemaining * 1000);
                    });
                }

                // Team metadata
                game.won.region = g.teamRegionsCache[game.won.tid];
                game.won.name = g.teamNamesCache[game.won.tid];
                game.lost.region = g.teamRegionsCache[game.lost.tid];
                game.lost.name = g.teamNamesCache[game.lost.tid];

                if (game.overtimes === 1) {
                    game.overtime = " (OT)";
                } else if (game.overtimes > 1) {
                    game.overtime = " (" + game.overtimes + "OT)";
                } else {
                    game.overtime = "";
                }

                cb(game);
            };
        } else {
            cb({});
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
        this.boxScore = {
            gid: ko.observable(-1)
        };
        this.gamesList = {
            abbrev: ko.observable(),
            loading: ko.observable(true), // Needed because this isn't really set until updateGamesList, which could be after first render
            season: ko.observable(),
            games: ko.observableArray([])
        };

        // This computed is used so the box score won't be rendered until after it is fully loaded (due to the throttle). Otherwise, the mapping plugin sometimes sets the gid before the rest of the box score.
        // But because it's throttled, ui.tableClickableRows can't be called directly in uiFirst or uiEvery.
        this.showBoxScore = ko.computed(function () {
            return this.boxScore.gid() >= 0;
        }, this).extend({throttle: 1});
    }

/* This doesn't work for some reason.
    mapping = {
        gamesList: {
            update: function (options) {
                return new function () {
                    komapping.fromJS(options.data, {
                        games: {
                            create: function (options) {
                                return options.data;
                            }
                        }
                    }, this);
                }();
            }
        }
    };*/

    function updateTeamSeason(inputs, updateEvents, vm) {
        var deferred;

        deferred = $.Deferred();
        deferred.resolve({
            // Needed for dropdown
            abbrev: inputs.abbrev,
            season: inputs.season
        });
        return deferred.promise();
    }

    /**
     * Update the displayed box score, as necessary.
     *
     * If the box score is already loaded, nothing is done.
     *
     * @memberOf views.gameLog
     * @param {number} inputs.gid Integer game ID for the box score (a negative number means no box score).
     */
    function updateBoxScore(inputs, updateEvents, vm) {
        var deferred, vars;

        deferred = $.Deferred();
        vars = {};

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || inputs.gid !== vm.boxScore.gid()) {
            boxScore(inputs.gid, function (game) {
                vars.boxScore = game;
                vars.boxScore.gid = inputs.gid;

                // Force scroll to top, which otherwise wouldn't happen because this is an internal link
                window.scrollTo(window.pageXOffset, 0);

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
     * @param {string} inputs.abbrev Abbrev of the team for the list of games.
     * @param {number} inputs.season Season for the list of games.
     * @param {number} inputs.gid Integer game ID for the box score (a negative number means no box score), which is used only for highlighting the relevant entry in the list.
     */
    function updateGamesList(inputs, updateEvents, vm) {
        var deferred;

        deferred = $.Deferred();

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || inputs.abbrev !== vm.gamesList.abbrev() || inputs.season !== vm.gamesList.season()) {
            // Load all games in list
            vm.gamesList.loading(true);
            vm.gamesList.games([]);
            helpers.gameLogList(inputs.abbrev, inputs.season, inputs.gid, vm.gamesList.games(), function (games) {
                vm.gamesList.games(games);
                vm.gamesList.abbrev(inputs.abbrev);
                vm.gamesList.season(inputs.season);
                vm.gamesList.loading(false);
                deferred.resolve();
/* This doesn't work for some reason.
                deferred.resolve({
                    gamesList: {
                        games: games,
                        abbrev: inputs.abbrev,
                        season: inputs.season,
                        loading: false
                    }
                });*/
            });
            return deferred.promise();
        }
        if (updateEvents.indexOf("gameSim") >= 0 && inputs.season === g.season) {
            // Partial update of only new games
            helpers.gameLogList(inputs.abbrev, inputs.season, inputs.gid, vm.gamesList.games(), function (games) {
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

        // Game log list dynamic highlighting
        $("#game-log-list").on("click", "tbody tr", function (event) {
            $(this).addClass("info").siblings().removeClass("info");
        });
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("game-log-dropdown", ["teams", "seasons"], [vm.abbrev(), vm.season()], updateEvents, vm.boxScore.gid() >= 0 ? vm.boxScore.gid() : undefined);

        // UGLY HACK for two reasons:
        // 1. Box score might be hidden if none is loaded, so in that case there is no table to make clickable
        // 2. When box scores are shown, it might happen after uiEvery is called because vm.showBoxScore is throttled
        window.setTimeout(function () {
            var tableEls;

            tableEls = $(".box-score-team");
            if (tableEls.length > 0 && !tableEls[0].classList.contains("table-hover")) {
                ui.tableClickableRows(tableEls);
            }
        }, 100);
    }

    return bbgmView.init({
        id: "gameLog",
        get: get,
        InitViewModel: InitViewModel,
        runBefore: [updateBoxScore, updateTeamSeason],
        runWhenever: [updateGamesList],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});