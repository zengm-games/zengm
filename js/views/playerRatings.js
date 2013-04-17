/**
 * @name views.playerRatings
 * @namespace Player ratings table.
 */
define(["db", "globals", "ui", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (db, g, ui, $, ko, _, components, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    function get(req) {
        return {
            season: helpers.validateSeason(req.params.season)
        };
    }

    function InitViewModel() {
        this.season = ko.observable();
        this.players = [];
    }

    mapping = {
        players: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updatePlayers(inputs, updateEvents, vm) {
        var deferred, vars;

        if ((inputs.season === g.season && updateEvents.indexOf("playerMovement") >= 0) || (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.PRESEASON) || inputs.season !== vm.season()) {
            deferred = $.Deferred();
            vars = {};

            g.dbl.transaction(["players"]).objectStore("players").getAll().onsuccess = function (event) {
                var attributes, players, ratings, stats;

                attributes = ["pid", "name", "pos", "age", "abbrev", "injury"];
                ratings = ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb", "skills"];
                stats = [];
                players = db.getPlayers(event.target.result, inputs.season, null, attributes, stats, ratings, {showRookies: true});

                vars = {
                    season: inputs.season,
                    players: players
                };

                deferred.resolve(vars);
            };
            return deferred.promise();
        }
    }

    function uiEvery(updateEvents, vm) {
        var season;

        season = vm.season();

        ui.title("Player Ratings - " + season);

        components.dropdown("player-ratings-dropdown", ["seasons"], [season], updateEvents);

        ui.datatable($("#player-ratings"), 4, _.map(vm.players, function (p) {
            return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills), p.pos, '<a href="/l/' + g.lid + '/roster/' + p.abbrev + '/' + season + '">' + p.abbrev + '</a>', String(p.age), String(p.ratings.ovr), String(p.ratings.pot), String(p.ratings.hgt), String(p.ratings.stre), String(p.ratings.spd), String(p.ratings.jmp), String(p.ratings.endu), String(p.ratings.ins), String(p.ratings.dnk), String(p.ratings.ft), String(p.ratings.fg), String(p.ratings.tp), String(p.ratings.blk), String(p.ratings.stl), String(p.ratings.drb), String(p.ratings.pss), String(p.ratings.reb)];
        }));
    }

    return bbgmView.init({
        id: "playerRatings",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updatePlayers],
        uiEvery: uiEvery
    });
});