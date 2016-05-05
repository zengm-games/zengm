const g = require('../globals');
const ui = require('../ui');
const game = require('../core/game');
const $ = require('jquery');
const ko = require('knockout');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

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

    $("#live-games-list button").attr("disabled", "disabled");

    // Start 1 day of game simulation
    // Prevent any redirects, somehow
    // Get play by play for gid through raw of ui.realtimeUpdate
    // gameSim with playByPlay in raw leads to display of play by play in updatePlayByPlay
    game.play(1, true, gid);
}

function InitViewModel() {
    this.playByPlay = ko.observableArray();

    this.games = ko.observable();
    this.speed = ko.observable(4);

    // See views.gameLog for explanation
    this.boxScore = {
        gid: ko.observable(-1)
    };
    this.showBoxScore = ko.computed(function () {
        return this.boxScore.gid() >= 0;
    }, this).extend({throttle: 1});
}

function updatePlayByPlay(inputs, updateEvents, vm) {
    if (inputs.playByPlay !== undefined && inputs.playByPlay.length > 0) {
        return g.dbl.games.get(inputs.gidPlayByPlay).then(function (boxScore) {
            var i, j, resetStats, s;

            // Stats to set to 0
            resetStats = ["min", "fg", "fga", "tp", "tpa", "ft", "fta", "orb", "trb", "ast", "tov", "stl", "blk", "ba", "pf", "pts", "pm"];

            boxScore.overtime = "";
            boxScore.quarter = "1st quarter";
            boxScore.time = "12:00";
            boxScore.gameOver = false;
            for (i = 0; i < boxScore.teams.length; i++) {
                // Team metadata
                boxScore.teams[i].abbrev = g.teamAbbrevsCache[boxScore.teams[i].tid];
                boxScore.teams[i].region = g.teamRegionsCache[boxScore.teams[i].tid];
                boxScore.teams[i].name = g.teamNamesCache[boxScore.teams[i].tid];

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

                    if (j < 5) {
                        boxScore.teams[i].players[j].inGame = true;
                    } else {
                        boxScore.teams[i].players[j].inGame = false;
                    }
                }
            }

            return {
                boxScore: boxScore
            };
        });
    }

    // If no game is loaded by this point (either by this GET or a prior one), leave
    if (vm.boxScore.gid() < 0) {
        return {
            redirectUrl: helpers.leagueUrl(["live"])
        };
    }
}

function uiFirst() {
    var playByPlayList;

    ui.title("Live Game Simulation");

    // Keep plays list always visible
    $("#affixPlayByPlay").affix({
        offset: {
            top: 80
        }
    });

    // Keep height of plays list equal to window
    playByPlayList = document.getElementById("playByPlayList");
    playByPlayList.style.height = (window.innerHeight - 114) + "px";
    window.addEventListener("resize", function () {
        playByPlayList.style.height = (window.innerHeight - 114) + "px";
    });
}

function startLiveGame(inputs, updateEvents, vm) {
    var events, overtimes, processToNextPause;

    if (inputs.playByPlay !== undefined && inputs.playByPlay.length > 0) {
        events = inputs.playByPlay;
        overtimes = 0;

        processToNextPause = function () {
            var e, i, j, k, ptsQtrs, stop, text;

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

                    // Show score after scoring plays
                    if (text.indexOf("made") >= 0) {
                        text += " (" + vm.boxScore.teams()[0].pts() + "-" + vm.boxScore.teams()[1].pts() + ")";
                    }

                    vm.boxScore.time(e.time);

                    stop = true;
                } else if (e.type === "sub") {
                    for (i = 0; i < vm.boxScore.teams()[e.t].players().length; i++) {
                        if (vm.boxScore.teams()[e.t].players()[i].pid() === e.on) {
                            vm.boxScore.teams()[e.t].players()[i].inGame(true);
                        } else if (vm.boxScore.teams()[e.t].players()[i].pid() === e.off) {
                            vm.boxScore.teams()[e.t].players()[i].inGame(false);
                        }
                    }
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
                    } else if (e.s === "min" || e.s === "fg" || e.s === "fga" || e.s === "tp" || e.s === "tpa" || e.s === "ft" || e.s === "fta" || e.s === "ast" || e.s === "tov" || e.s === "stl" || e.s === "blk" || e.s === "ba" || e.s === "pf" || e.s === "pts") {
                        vm.boxScore.teams()[e.t].players()[e.p][e.s](vm.boxScore.teams()[e.t].players()[e.p][e.s]() + e.amt);
                        vm.boxScore.teams()[e.t][e.s](vm.boxScore.teams()[e.t][e.s]() + e.amt);

                        if (e.s === "pts") {
                            for (j = 0; j < 2; j++) {
                                for (k = 0; k < vm.boxScore.teams()[j].players().length; k++) {
                                    if (vm.boxScore.teams()[j].players()[k].inGame() === true) {
                                        vm.boxScore.teams()[j].players()[k].pm(vm.boxScore.teams()[j].players()[k].pm() + (e.t === j ? e.amt : -e.amt));
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (text !== null) {
                vm.playByPlay.unshift(text);
            }

            if (events.length > 0) {
                setTimeout(processToNextPause, 4000 / Math.pow(1.2, vm.speed()));
            } else {
                vm.boxScore.time("0:00");
                vm.boxScore.gameOver(true);
            }
        };

        processToNextPause();
    }
}

module.exports = bbgmView.init({
    id: "liveGame",
    get,
    post: post,
    InitViewModel,
    runBefore: [updatePlayByPlay],
    runAfter: [startLiveGame],
    uiFirst
});
