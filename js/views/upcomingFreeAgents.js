/**
 * @name views.upcomingFreeAgents
 * @namespace List of upcoming free agents.
 */
define(["dao", "globals", "ui", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers", "views/components"], function (dao, g, ui, player, $, ko, _, bbgmView, helpers, components) {
    "use strict";

    var mapping;

    function get(req) {
        var season;

        season = helpers.validateSeason(req.params.season);

        if (g.phase <= g.PHASE.RESIGN_PLAYERS) {
            if (season < g.season) {
                season = g.season;
            }
        } else {
            if (season < g.season + 1) {
                season = g.season + 1;
            }
        }

        return {
            season: season
        };
    }

    mapping = {
        players: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateUpcomingFreeAgents(inputs) {
        return dao.players.getAll({
            index: "tid",
            key: IDBKeyRange.lowerBound(0),
            statsSeasons: [g.season],
            filter: function (p) {
                return p.contract.exp === inputs.season;
            }
        }).then(function (players) {
            var i;

            // Done before filter so full player object can be passed to player.genContract.
            for (i = 0; i < players.length; i++) {
                players[i].contractDesired = player.genContract(players[i], false, false); // No randomization
                players[i].contractDesired.amount /= 1000;
                players[i].contractDesired.exp += inputs.season - g.season;
            }

            players = player.filter(players, {
                attrs: ["pid", "name", "pos", "age", "contract", "freeAgentMood", "injury", "watch", "contractDesired"],
                ratings: ["ovr", "pot", "skills"],
                stats: ["min", "pts", "trb", "ast", "per"],
                season: g.season,
                showNoStats: true,
                showRookies: true,
                fuzz: true
            });

            return {
                players: players,
                season: inputs.season
            };
        });
    }

    function uiFirst(vm) {
        ui.title("Upcoming Free Agents");


        ko.computed(function () {
            ui.datatable($("#upcoming-free-agents"), 4, _.map(vm.players(), function (p) {
                // The display: none for mood allows sorting, somehow
                return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), helpers.round(p.stats.min, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.per, 1), helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp, helpers.formatCurrency(p.contractDesired.amount, "M") + ' thru ' + p.contractDesired.exp];
            }));
        }).extend({throttle: 1});

        ui.tableClickableRows($("#upcoming-free-agents"));
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("upcoming-free-agents-dropdown", ["seasonsUpcoming"], [vm.season()], updateEvents);
    }

    return bbgmView.init({
        id: "upcomingFreeAgents",
        get: get,
        mapping: mapping,
        runBefore: [updateUpcomingFreeAgents],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});