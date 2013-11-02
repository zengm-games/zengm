/**
 * @name views.live
 * @namespace Live play-by-play game simulation.
 */
define(["globals", "ui", "core/game", "core/season", "lib/jquery", "lib/knockout", "util/bbgmView", "util/viewHelpers"], function (g, ui, game, season, $, ko, bbgmView, viewHelpers) {
    "use strict";

    function get(req) {
        if (req.raw.playByPlay !== undefined) {
            return {
                playByPlay: req.raw.playByPlay
            };
        }
    }

    function post(req) {
        var gid;

        gid = parseInt(req.params.gid, 10);
console.log(gid);

        $("#games-list button").attr("disabled", "disabled");

        // Start 1 day of game simulation
        // Prevent any redirects, somehow
        // Get play by play for gid through raw of ui.realtimeUpdate
        // gameSim with playByPlay in raw leads to display of play by play in updatePlayByPlay
        // set inProgress to false
        game.play(1, true, gid);
    }

    function InitViewModel() {
        // inProgress is true: game simulation is running, but not done. disable form.
        // playByPlay length > 0: game simulation result is here, hide form and show play by play
        this.inProgress = ko.observable(false);
        this.games = ko.observable();
        this.playByPlay = ko.observableArray();
    }

    function updateGamesList(inputs, updateEvents, vm) {
        var deferred;

        if (!vm.inProgress() && (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("gameSim") >= 0)) {
            deferred = $.Deferred();

            season.getSchedule(null, 1, function (games) {
                var i;

                for (i = 0; i < games.length; i++) {
                    if (games[i].awayTid === g.userTid || games[i].homeTid === g.userTid) {
                        games[i].highlight = true;
                    } else {
                        games[i].highlight = false;
                    }
                }

                deferred.resolve({
                    games: games
                });
            });

            return deferred.promise();
        }
    }

    function updatePlayByPlay(inputs, updateEvents, vm) {
        var events;

        function processToNextPause() {
            var e, stop, text;

            stop = false;
            while (!stop && events.length > 0) {
                e = events.shift();
                if (e.s === "min" || e.s === "pts") {
                    continue;
                } else if (e.s === "fg" || e.s === "fga") {
                    continue;
                } else if (e.s === "drb") {
                    text = "Defensive rebound";
                    stop = true;
                } else if (e.s === "orb") {
                    text = "Offensive rebound";
                    stop = true;
                } else if (e.s === "fta") {
                    if (events[0].s === "ft") {
                        text = "Made ft";
                        events.shift();
                        stop = true;
                    } else {
                        text = "Missed ft";
                        if (events[0].s !== "drb" && events[0].s !== "orb") {
                            stop = true;
                        }
                    }
                } else if (e.s === "fgaAtRim") {
                    if (events[0].s === "fgAtRim") {
                        text = "Made dunk/layup";
                        events.shift();
                        stop = true;
                        if (events[0].s === "ast") {
                            text += " (ast)";
                            events.shift();
                        }
                    } else if (events[0].s === "pf") {
                        text = "Foul";
                        events.shift();
                        stop = true;
                    } else {
                        if (events[0].s === "blk") {
                            text = "Player's dunk/layup blocked by player";
                            events.shift();
                        } else {
                            text = "Missed dunk/layup";
                        }
                        if (events[0].s !== "drb" && events[0].s !== "orb") {
                            stop = true;
                        }
                    }
                } else if (e.s === "fgaLowPost") {
                    if (events[0].s === "fgLowPost") {
                        text = "Made low post shot";
                        events.shift();
                        stop = true;
                        if (events[0].s === "ast") {
                            text += " (ast)";
                            events.shift();
                        }
                    } else {
                        if (events[0].s === "blk") {
                            text = "Player's low post shot blocked by player";
                            events.shift();
                        } else {
                            text = "Missed low post shot";
                        }
                        if (events[0].s !== "drb" && events[0].s !== "orb") {
                            stop = true;
                        }
                    }
                } else if (e.s === "fgaMidRange") {
                    if (events[0].s === "fgMidRange") {
                        text = "Made mid-range shot";
                        events.shift();
                        stop = true;
                        if (events[0].s === "ast") {
                            text += " (ast)";
                            events.shift();
                        }
                    } else {
                        if (events[0].s === "blk") {
                            text = "Player's mid-range shot blocked by player";
                            events.shift();
                        } else {
                            text = "Missed mid-range shot";
                        }
                        if (events[0].s !== "drb" && events[0].s !== "orb") {
                            stop = true;
                        }
                    }
                } else if (e.s === "tpa") {
                    if (events[0].s === "tp") {
                        text = "Made three pointer";
                        events.shift();
                        stop = true;
                        if (events[0].s === "ast") {
                            text += " (ast)";
                            events.shift();
                        }
                    } else {
                        if (events[0].s === "blk") {
                            text = "Player's three pointer blocked by player";
                            events.shift();
                        } else {
                            text = "Missed three pointer";
                        }
                        if (events[0].s !== "drb" && events[0].s !== "orb") {
                            stop = true;
                        }
                    }
                } else if (e.s === "tov") {
                    if (events[0].s === "stl") {
                        text = "Player steals the ball from player";
                        events.shift();
                    } else {
                        text = "Player turns the ball over";
                    }
                    stop = true;
                } else {
                    console.log(e);
                }
            }

            vm.playByPlay.unshift(text);

            if (events.length > 0) {
                setTimeout(processToNextPause, 50);
            }
        }

        if (vm.inProgress() && inputs.playByPlay !== undefined && inputs.playByPlay.length > 0) {
            events = inputs.playByPlay;
            processToNextPause();
            // Update box score observable with each stat
            // Update playByPlay with text strings
        }
    }

    function uiFirst(vm) {
        ui.title("Live Game Simulation");

        // The rest is handled in post(). This is needed to get at vm.
        $("#games-list").on("click", "button", function () {
            vm.inProgress(true);
        });
    }

    return bbgmView.init({
        id: "live",
        get: get,
        post: post,
        InitViewModel: InitViewModel,
        runBefore: [updateGamesList, updatePlayByPlay],
        uiFirst: uiFirst
    });
});