/**
 * @name views.playerRatings
 * @namespace Player ratings table.
 */
define(["db", "globals", "ui", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/helpers", "util/viewHelpers"], function (db, g, ui, $, ko, _, components, helpers, viewHelpers) {
    "use strict";

    var players, vm;

    function loadAfter(cb) {
        var season;

        season = vm.season();

        ui.datatable($("#player-ratings"), 4, _.map(players, function (p) {
            return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills), p.pos, '<a href="/l/' + g.lid + '/roster/' + p.abbrev + '/' + season + '">' + p.abbrev + '</a>', String(p.age), String(p.ratings.ovr), String(p.ratings.pot), String(p.ratings.hgt), String(p.ratings.stre), String(p.ratings.spd), String(p.ratings.jmp), String(p.ratings.endu), String(p.ratings.ins), String(p.ratings.dnk), String(p.ratings.ft), String(p.ratings.fg), String(p.ratings.tp), String(p.ratings.blk), String(p.ratings.stl), String(p.ratings.drb), String(p.ratings.pss), String(p.ratings.reb)];
        }));

        cb();
    }

    function display(updateEvents, cb) {
        var leagueContentEl, season;

        season = vm.season();

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "playerRatings") {
            ui.update({
                container: "league_content",
                template: "playerRatings"
            });
            ko.applyBindings(vm, leagueContentEl);
        }
        ui.title("Player Ratings - " + season);

        components.dropdown("player-ratings-dropdown", ["seasons"], [season], updateEvents);

        cb();
    }

    function loadBefore(season, cb) {
        g.dbl.transaction(["players"]).objectStore("players").getAll().onsuccess = function (event) {
            var attributes, ratings, stats;

            attributes = ["pid", "name", "pos", "age", "abbrev", "injury"];
            ratings = ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb", "skills"];
            stats = [];
            players = db.getPlayers(event.target.result, season, null, attributes, stats, ratings, {showRookies: true});

            vm.season(season);

            cb();
        };
    }

    function update(season, updateEvents, cb) {
        var leagueContentEl;

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "playerRatings") {
            ko.cleanNode(leagueContentEl);
            vm = {
                season: ko.observable()
            };
        }

        if ((season === g.season && updateEvents.indexOf("playerMovement") >= 0) || (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.PRESEASON) || season !== vm.season()) {
            loadBefore(season, function () {
                display(updateEvents, function () {
                    loadAfter(cb);
                });
            });
        } else {
            display(updateEvents, cb);
        }
    }

    function get(req) {
        viewHelpers.beforeLeague(req, function (updateEvents, cb) {
            var season;

            season = helpers.validateSeason(req.params.season);

            update(season, updateEvents, cb);
        });
    }

    return {
        update: update,
        get: get
    };
});