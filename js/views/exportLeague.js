/**
 * @name views.exportRosters
 * @namespace Export rosters.
 */
define(["globals", "ui", "core/league", "lib/jquery", "lib/knockout", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, league, $, ko, bbgmView, helpers, viewHelpers) {
    "use strict";

    function InitViewModel() {
        this.generating = ko.observable(false);
        this.generated = ko.observable(false);
        this.expired = ko.observable(false);

        this.fileName = ko.observable("");
        this.url = ko.observable("");
    }

    function get(req) {
        if (req.raw.hasOwnProperty("objectStores")) {
            return {
                objectStores: req.raw.objectStores
            };
        }
    }

    function post(req) {
        ui.realtimeUpdate([], helpers.leagueUrl(["export_league"]), undefined, {
            objectStores: req.params.objectStores.join(",").split(",")
        });
    }

    function updateExportLeague(inputs, updateEvents, vm) {
        var categories;

        if (updateEvents.indexOf("firstRun") >= 0) {
            categories = [
                {
                    objectStores: "players,releasedPlayers,awards",
                    name: "Players",
                    desc: "All player info, stats, ratings, and awards.",
                    checked: true
                },
                {
                    objectStores: "teams",
                    name: "Teams",
                    desc: "All team info and stats.",
                    checked: true
                },
                {
                    objectStores: "schedule,playoffSeries",
                    name: "Schedule",
                    desc: "Current regular season schedule and playoff series.",
                    checked: true
                },
                {
                    objectStores: "draftPicks",
                    name: "Draft Picks",
                    desc: "Traded draft picks.",
                    checked: true
                },
                {
                    objectStores: "trade,negotiations,gameAttributes,draftOrder,messages,events",
                    name: "Game State",
                    desc: "Interactions with the owner, current contract negotiations, current game phase, etc. Useful for saving or backing up a game, but not for creating custom rosters.",
                    checked: true
                },
                {
                    objectStores: "games",
                    name: "Box Scores",
                    desc: '<span class="text-danger">If you\'ve played more than a few seasons, this takes up a ton of space!</span>',
                    checked: false
                }
            ];
            return {categories: categories};
        }

        if (inputs.hasOwnProperty("objectStores")) {
            vm.generated(false);
            vm.generating(true);
            vm.expired(false);

            league.export_(inputs.objectStores, function (data) {
                var blob, fileName, json, url;

                json = JSON.stringify(data, undefined, 2);
                blob = new Blob([json], {type: "application/json"});
                url = window.URL.createObjectURL(blob);

                fileName = data.meta !== undefined ? data.meta.name : "League";
                vm.fileName("BBGM - " + fileName + ".json");
                vm.url(url);

                vm.generating(false);
                vm.generated(true);
                vm.expired(false);

                // Delete object, eventually
                window.setTimeout(function () {
                    window.URL.revokeObjectURL(url);
                    json = null;
                    blob = null;
                    vm.url("");

                    vm.generated(false);
                    vm.expired(true);
                    downloadLink.innerHTML = "Download link expired."; // Remove expired link
                }, 60 * 1000);
            });
        }
    }

    function uiFirst() {
        ui.title("Export League");
    }

    return bbgmView.init({
        id: "exportLeague",
        InitViewModel: InitViewModel,
        get: get,
        post: post,
        runBefore: [updateExportLeague],
        uiFirst: uiFirst
    });
});