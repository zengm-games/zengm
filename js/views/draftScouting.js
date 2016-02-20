'use strict';

var g = require('../globals');
var ui = require('../ui');
var draft = require('../core/draft');
var finances = require('../core/finances');
var player = require('../core/player');
var backboard = require('backboard');
var Promise = require('bluebird');
var $ = require('jquery');
var ko = require('knockout');
var _ = require('underscore');
var bbgmView = require('../util/bbgmView');
var helpers = require('../util/helpers');

var mapping;

function addSeason(season, tid) {
    return g.dbl.players.index('tid').getAll(tid).then(function (playersAll) {
        var i, p, pa, players;

        playersAll = player.filter(playersAll, {
            attrs: ["pid", "name", "age", "watch", "valueFuzz"],
            ratings: ["ovr", "pot", "skills", "fuzz", "pos"],
            showNoStats: true,
            showRookies: true,
            fuzz: true
        });

        players = [];
        for (i = 0; i < playersAll.length; i++) {
            pa = playersAll[i];

            // Abbrevaite first name to prevent overflows
            pa.name = pa.name.split(" ")[0].substr(0, 1) + ". " + pa.name.split(" ")[1];

            // Attributes
            p = {pid: pa.pid, name: pa.name, age: pa.age, watch: pa.watch, valueFuzz: pa.valueFuzz};

            // Ratings - just take the only entry
            p.ovr = pa.ratings[0].ovr;
            p.pot = pa.ratings[0].pot;
            p.skills = pa.ratings[0].skills;
            p.pos = pa.ratings[0].pos;

            players.push(p);
        }

        // Rank prospects
        players.sort(function (a, b) { return b.valueFuzz - a.valueFuzz; });
        for (i = 0; i < players.length; i++) {
            players[i].rank = i + 1;
        }

        return {
            players: players,
            season: season
        };
    });
}

mapping = {
    seasons: {
        create: function (options) {
            return options.data;
        }
    }
};

function updateDraftScouting(inputs, updateEvents) {
    var firstUndraftedTid, seasonOffset;

    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("dbChange") >= 0) {
        // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
        if (g.phase < g.PHASE.FREE_AGENCY) {
            seasonOffset = 0;
        } else {
            seasonOffset = 1;
        }

        // In fantasy draft, use temp tid
        if (g.phase === g.PHASE.FANTASY_DRAFT) {
            firstUndraftedTid = g.PLAYER.UNDRAFTED_FANTASY_TEMP;
        } else {
            firstUndraftedTid = g.PLAYER.UNDRAFTED;
        }

        return Promise.all([
            addSeason(g.season + seasonOffset, firstUndraftedTid),
            addSeason(g.season + seasonOffset + 1, g.PLAYER.UNDRAFTED_2),
            addSeason(g.season + seasonOffset + 2, g.PLAYER.UNDRAFTED_3)
        ]).then(function (seasons) {
            return {
                seasons: seasons
            };
        });
    }
}

function customDraftClassHandler(e) {
    var draftClassTid, file, reader, seasonOffset;

    seasonOffset = parseInt(e.target.dataset.index, 10);
    file = e.target.files[0];

    // What tid to replace?
    if (seasonOffset === 0) {
        draftClassTid = g.PLAYER.UNDRAFTED;
    } else if (seasonOffset === 1) {
        draftClassTid = g.PLAYER.UNDRAFTED_2;
    } else if (seasonOffset === 2) {
        draftClassTid = g.PLAYER.UNDRAFTED_3;
    } else {
        throw new Error("Invalid draft class index");
    }

    reader = new window.FileReader();
    reader.readAsText(file);
    reader.onload = function (event) {
        var players, uploadedFile;

        uploadedFile = JSON.parse(event.target.result);

        // Get all players from uploaded files
        players = uploadedFile.players;

        // Filter out any that are not draft prospects
        players = players.filter(function (p) {
            return p.tid === g.PLAYER.UNDRAFTED;
        });

        // Get scouting rank, which is used in a couple places below
        g.dbl.teams.get(g.userTid).then(function (t) {
            var scoutingRank;

            scoutingRank = finances.getRankLastThree(t, "expenses", "scouting");

            // Delete old players from draft class
            return g.dbl.tx(["players", "playerStats"], "readwrite", function (tx) {
                return tx.players.index('tid').iterate(backboard.only(draftClassTid), function (p) {
                    return tx.players.delete(p.pid);
                }).then(function () {
                    var draftYear, i, seasonOffset2, uploadedSeason;

                    // Find season from uploaded file, for age adjusting
                    if (uploadedFile.hasOwnProperty("gameAttributes")) {
                        for (i = 0; i < uploadedFile.gameAttributes.length; i++) {
                            if (uploadedFile.gameAttributes[i].key === "season") {
                                uploadedSeason = uploadedFile.gameAttributes[i].value;
                                break;
                            }
                        }
                    } else if (uploadedFile.hasOwnProperty("startingSeason")) {
                        uploadedSeason = uploadedFile.startingSeason;
                    }

                    seasonOffset2 = seasonOffset;
                    if (g.phase >= g.PHASE.FREE_AGENCY) {
                        // Already generated next year's draft, so bump up one
                        seasonOffset2 += 1;
                    }

                    draftYear = g.season + seasonOffset2;

                    // Add new players to database
                    players.forEach(function (p) {
                        // Make sure player object is fully defined
                        p = player.augmentPartialPlayer(p, scoutingRank);

                        // Manually set TID, since at this point it is always g.PLAYER.UNDRAFTED
                        p.tid = draftClassTid;

                        // Manually remove PID, since all it can do is cause trouble
                        if (p.hasOwnProperty("pid")) {
                            delete p.pid;
                        }

                        // Adjust age
                        if (uploadedSeason !== undefined) {
                            p.born.year += g.season - uploadedSeason + seasonOffset2;
                        }

                        // Adjust seasons
                        p.ratings[0].season = draftYear;
                        p.draft.year = draftYear;

                        // Don't want lingering stats vector in player objects, and draft prospects don't have any stats
                        delete p.stats;

                        player.updateValues(tx, p, []).then(function (p) {
                            tx.players.put(p);
                        });
                    });

                    // "Top off" the draft class if <70 players imported
                    if (players.length < 70) {
                        draft.genPlayers(tx, draftClassTid, scoutingRank, 70 - players.length);
                    }
                });
            }).then(function () {
                ui.realtimeUpdate(["dbChange"]);
            });
        });
    };
}

function uiFirst(vm) {
    ui.title("Draft Scouting");

    ko.computed(function () {
        var i, seasons;
        seasons = vm.seasons();
        for (i = 0; i < seasons.length; i++) {
            ui.datatableSinglePage($("#draft-scouting-" + i), 4, _.map(seasons[i].players, function (p) {
                return [String(p.rank), helpers.playerNameLabels(p.pid, p.name, undefined, p.skills, p.watch), p.pos, String(p.age), String(p.ovr), String(p.pot)];
            }));
        }
    }).extend({throttle: 1});

    ui.tableClickableRows($("#draft-scouting"));
}

function uiEvery() {
    var i, uploadFileButtons;

    // Handle custom roster buttons - this needs to be in uiEvery or it's lost when page reloads
    // This could somehow lead to double calling customDraftClassHandler, but that doesn't seem to actually happen
    uploadFileButtons = document.getElementsByClassName("custom-draft-class");
    for (i = 0; i < uploadFileButtons.length; i++) {
        uploadFileButtons[i].addEventListener("change", customDraftClassHandler);
    }

    // Same uiEvery rationale as above
    document.getElementById("toggle-0").addEventListener("click", function (e) {
        e.preventDefault();
        this.style.display = "none";
        document.getElementById("form-0").style.display = "block";
    });
    document.getElementById("toggle-1").addEventListener("click", function (e) {
        e.preventDefault();
        this.style.display = "none";
        document.getElementById("form-1").style.display = "block";
    });
    document.getElementById("toggle-2").addEventListener("click", function (e) {
        e.preventDefault();
        this.style.display = "none";
        document.getElementById("form-2").style.display = "block";
    });
}

module.exports = bbgmView.init({
    id: "draftScouting",
    mapping: mapping,
    runBefore: [updateDraftScouting],
    uiFirst: uiFirst,
    uiEvery: uiEvery
});
