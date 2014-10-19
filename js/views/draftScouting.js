/**
 * @name views.draftScouting
 * @namespace Scouting prospects in future drafts.
 */
define(["dao", "globals", "ui", "core/draft", "core/finances", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers"], function (dao, g, ui, draft, finances, player, $, ko, _, bbgmView, helpers) {
    "use strict";

    var mapping;

    function addSeason(seasons, season, tid, cb) {
        dao.players.getAll({
            index: "tid",
            key: tid,
            statSeasons: []
        }, function (playersAll) {
            var i, pa, p, players;

            playersAll = player.filter(playersAll, {
                attrs: ["pid", "name", "pos", "age", "watch", "valueFuzz"],
                ratings: ["ovr", "pot", "skills", "fuzz"],
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
                p = {pid: pa.pid, name: pa.name, pos: pa.pos, age: pa.age, watch: pa.watch, valueFuzz: pa.valueFuzz};

                // Ratings - just take the only entry
                p.ovr = pa.ratings[0].ovr;
                p.pot = pa.ratings[0].pot;
                p.skills = pa.ratings[0].skills;

                players.push(p);
            }

            // Rank prospects
            players.sort(function (a, b) { return b.valueFuzz - a.valueFuzz; });
            for (i = 0; i < players.length; i++) {
                players[i].rank = i + 1;players[i].rank = i + 1;
            }

            seasons.push({
                players: players,
                season: season
            });

            cb();
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
        var deferred, firstUndraftedTid, seasonOffset, seasons;

        if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("dbChange") >= 0) {
            deferred = $.Deferred();

            seasons = [];

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

            addSeason(seasons, g.season + seasonOffset, firstUndraftedTid, function () {
                addSeason(seasons, g.season + seasonOffset + 1, g.PLAYER.UNDRAFTED_2, function () {
                    addSeason(seasons, g.season + seasonOffset + 2, g.PLAYER.UNDRAFTED_3, function () {
                        deferred.resolve({
                            seasons: seasons
                        });
                    });
                });
            });

            return deferred.promise();
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
            var players;

            // Get all players from uploaded files
            players = JSON.parse(event.target.result).players;

            // Filter out any that are not draft prospects
            players = players.filter(function (p) {
                return p.tid === g.PLAYER.UNDRAFTED;
            });

            // Get scouting rank, which is used in a couple places below
            g.dbl.transaction("teams").objectStore("teams").get(g.userTid).onsuccess = function (event) {
                var playerStore, scoutingRank, t, tx;

                t = event.target.result;
                scoutingRank = finances.getRankLastThree(t, "expenses", "scouting");

                // Delete old players from draft class
                tx = g.dbl.transaction("players", "readwrite");
                playerStore = tx.objectStore("players");
                playerStore.index("tid").openCursor(IDBKeyRange.only(draftClassTid)).onsuccess = function (event) {
                    var cursor;
                    cursor = event.target.result;
                    if (cursor) {
                        playerStore.delete(cursor.primaryKey);
                        cursor.continue();
                    } else {
                        // Everything else proceeds after deletes have finished

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

                            dao.players.put({ot: playerStore, p: p});
                            console.log(p.name);
                        });

                        // "Top off" the draft class if <70 players imported
                        if (players.length < 70) {
                            draft.genPlayers(tx, draftClassTid, scoutingRank, 70 - players.length);
                        }
                    }
                };

                tx.oncomplete = function () {
                    ui.realtimeUpdate(["dbChange"]);
                };
            };
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

    return bbgmView.init({
        id: "draftScouting",
        mapping: mapping,
        runBefore: [updateDraftScouting],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});