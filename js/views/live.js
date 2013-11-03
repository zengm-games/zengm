/**
 * @name views.live
 * @namespace Live play-by-play game simulation.
 */
define(["globals", "ui", "core/game", "core/season", "lib/jquery", "lib/knockout", "util/bbgmView", "util/helpers"], function (g, ui, game, season, $, ko, bbgmView, helpers) {
    "use strict";

    function get(req) {
        if (req.raw.playByPlay !== undefined) {
            return {
                gidPlayByPlay: req.raw.gidPlayByPlay,
                playByPlay: req.raw.playByPlay
            };
        }
    }

    function post(req) {
        var gid;

        gid = parseInt(req.params.gid, 10);

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
        // stopPlayByPlay: when true, don't add on to play by play results
        this.inProgress = ko.observable(false);
        this.playByPlay = ko.observableArray();
        this.stopPlayByPlay = ko.observable(false);

        this.games = ko.observable();
        this.speed = ko.observable(1);

        // See views.gameLog for explanation
        this.boxScore = {
            gid: ko.observable(-1)
        };
        this.showBoxScore = ko.computed(function () {
            return this.boxScore.gid() >= 0;
        }, this).extend({throttle: 1});
    }

    function updateGamesList(inputs, updateEvents, vm) {
        var deferred;

        if (!vm.inProgress()) {
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
                    games: games,
                    boxScore: {gid: -1},
                    playByPlay: [],
                    stopPlayByPlay: true
                });
            });

            return deferred.promise();
        }
    }

    function updatePlayByPlay(inputs, updateEvents, vm) {
        var deferred, events, overtimes;

        function processToNextPause() {
            var e, ptsQtrs, stop, text;

            stop = false;
            while (!stop && events.length > 0) {
                text = null;

                e = events.shift();

                if (e.type === "text") {
                    if (e.t === 0 || e.t === 1) {
                        text = e.time + " - " + vm.boxScore.teams()[e.t].abbrev() + " - " + e.text;
                    } else {
                        text = e.text;
                    }
                    if (text.indexOf("made") >= 0) {
                        text += " (" + vm.boxScore.teams()[0].pts() + "-" + vm.boxScore.teams()[1].pts() + ")";
                    }
                    vm.boxScore.time(e.time);
                    stop = true;
                } else if (e.type === "stat") {
                    // Quarter-by-quarter score
                    if (e.s === "pts") {
                        // This is a hack because array elements are not made observable by default in the Knockout mapping plugin and I didn't want to write a really ugly mapping function.
                        ptsQtrs = vm.boxScore.teams()[e.t].ptsQtrs();
                        if (ptsQtrs.length <= e.qtr) {
                            // Must be overtime! This updates ptsQtrs too.
                            vm.boxScore.teams()[0].ptsQtrs.push(0);
                            vm.boxScore.teams()[1].ptsQtrs.push(0);

                            if (ptsQtrs.length > 4) {
                                overtimes += 1;
                                if (overtimes === 1) {
                                    vm.boxScore.overtime(" (OT)");
                                } else if (overtimes > 1) {
                                    vm.boxScore.overtime(" (" + overtimes + "OT)");
                                }
                                vm.boxScore.quarter(helpers.ordinal(overtimes) + " overtime");
                            } else {
                                vm.boxScore.quarter(helpers.ordinal(ptsQtrs.length) + " quarter");
                            }
                        }
                        ptsQtrs[e.qtr] += e.amt;
                        vm.boxScore.teams()[e.t].ptsQtrs(ptsQtrs);
                    }

                    // Everything else
                    if (e.s === "drb") {
                        vm.boxScore.teams()[e.t].players()[e.p].trb(vm.boxScore.teams()[e.t].players()[e.p].trb() + e.amt);
                        vm.boxScore.teams()[e.t].trb(vm.boxScore.teams()[e.t].trb() + e.amt);
                    } else if (e.s === "orb") {
                        vm.boxScore.teams()[e.t].players()[e.p].trb(vm.boxScore.teams()[e.t].players()[e.p].trb() + e.amt);
                        vm.boxScore.teams()[e.t].trb(vm.boxScore.teams()[e.t].trb() + e.amt);
                        vm.boxScore.teams()[e.t].players()[e.p][e.s](vm.boxScore.teams()[e.t].players()[e.p][e.s]() + e.amt);
                        vm.boxScore.teams()[e.t][e.s](vm.boxScore.teams()[e.t][e.s]() + e.amt);
                    } else if (e.s === "min" || e.s === "fg" || e.s === "fga" || e.s === "tp" || e.s === "tpa" || e.s === "ft" || e.s === "fta" || e.s === "ast" || e.s === "tov" || e.s === "stl" || e.s === "blk" || e.s === "pf" || e.s === "pts") {
                        vm.boxScore.teams()[e.t].players()[e.p][e.s](vm.boxScore.teams()[e.t].players()[e.p][e.s]() + e.amt);
                        vm.boxScore.teams()[e.t][e.s](vm.boxScore.teams()[e.t][e.s]() + e.amt);
                    }
                }
            }

            if (text !== null && !vm.stopPlayByPlay()) {
                vm.playByPlay.unshift(text);
            }

            if (events.length > 0) {
                if (!vm.stopPlayByPlay()) {
                    setTimeout(processToNextPause, 2000 / Math.pow(vm.speed(), 1.5));
                }
            } else {
                vm.boxScore.time("Final Score");
            }
        }

        if (vm.inProgress() && inputs.playByPlay !== undefined && inputs.playByPlay.length > 0) {
            deferred = $.Deferred();

            events = inputs.playByPlay;
            overtimes = 0;

            g.dbl.transaction("games").objectStore("games").get(inputs.gidPlayByPlay).onsuccess = function (event) {
                var boxScore, i, j, resetStats, s;

                // Stats to set to 0
                resetStats = ["min", "fg", "fga", "tp", "tpa", "ft", "fta", "orb", "trb", "ast", "tov", "stl", "blk", "pf", "pts"];

                boxScore = event.target.result;
                boxScore.overtime = "";
                boxScore.quarter = "1st quarter";
                boxScore.time = "12:00";
                for (i = 0; i < boxScore.teams.length; i++) {
                    boxScore.teams[i].ptsQtrs = [0];
                    for (s = 0; s < resetStats.length; s++) {
                        boxScore.teams[i][resetStats[s]] = 0;
                    }
                    for (j = 0; j < boxScore.teams[i].players.length; j++) {
                        // Fix for players who were hurt this game - don't show right away!
                        if (boxScore.teams[i].players[j].injury.type !== "Healthy" && boxScore.teams[i].players[j].min > 0) {
                            boxScore.teams[i].players[j].injury = {type: "Healthy", gamesRemaining: 0};
                        }

                        for (s = 0; s < resetStats.length; s++) {
                            boxScore.teams[i].players[j][resetStats[s]] = 0;
                        }
                    }
                }

                deferred.resolve({
                    inProgress: false, // Game sim is no longer running
                    boxScore: boxScore,
                    stopPlayByPlay: false
                });

                // Copied from views.gameSim                
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

                // Start showing play-by-play
                processToNextPause();
            };

            return deferred.promise();
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