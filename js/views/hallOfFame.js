/**
 * @name views.hallOfFame
 * @namespace Hall of fame table.
 */
define(["dao", "globals", "ui", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers"], function (dao, g, ui, player, $, ko, _, bbgmView, helpers) {
    "use strict";

    var mapping;

    function get(req) {
        return {
            season: helpers.validateSeason(req.params.season)
        };
    }

    function InitViewModel() {
        this.season = ko.observable();
    }

    mapping = {
        players: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updatePlayers(inputs, updateEvents) {
        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.BEFORE_DRAFT)) {
            return dao.players.getAll({
                index: "tid",
                key: g.PLAYER.RETIRED,
                statsSeasons: "all",
                filter: function (p) {
                    return p.hof;
                }
            }).then(function (players) {
                var i, j;

                players = player.filter(players, {
                    attrs: ["pid", "name", "pos", "draft", "retiredYear", "statsTids"],
                    ratings: ["ovr"],
                    stats: ["season", "abbrev", "gp", "min", "trb", "ast", "pts", "per", "ewa"]
                });

                // This stuff isn't in player.filter because it's only used here.
                for (i = 0; i < players.length; i++) {
                    players[i].peakOvr = 0;
                    for (j = 0; j < players[i].ratings.length; j++) {
                        if (players[i].ratings[j].ovr > players[i].peakOvr) {
                            players[i].peakOvr = players[i].ratings[j].ovr;
                        }
                    }

                    players[i].bestStats = {
                        gp: 0,
                        min: 0,
                        per: 0
                    };
                    for (j = 0; j < players[i].stats.length; j++) {
                        if (players[i].stats[j].gp * players[i].stats[j].min * players[i].stats[j].per > players[i].bestStats.gp * players[i].bestStats.min * players[i].bestStats.per) {
                            players[i].bestStats = players[i].stats[j];
                        }
                    }
                }

                return {
                    players: players
                };
            });
        }
    }

    function uiFirst(vm) {
        ui.title("Hall of Fame");

        ko.computed(function () {
            ui.datatable($("#hall-of-fame"), 2, _.map(vm.players(), function (p) {
                return ['<a href="' + helpers.leagueUrl(["player", p.pid]) + '">' + p.name + '</a>', p.pos, String(p.draft.year), String(p.retiredYear), String(p.peakOvr), String(p.bestStats.season), '<a href="' + helpers.leagueUrl(["roster", p.bestStats.abbrev, p.bestStats.season]) + '">' + p.bestStats.abbrev + '</a>', String(p.bestStats.gp), helpers.round(p.bestStats.min, 1), helpers.round(p.bestStats.pts, 1), helpers.round(p.bestStats.trb, 1), helpers.round(p.bestStats.ast, 1), helpers.round(p.bestStats.per, 1), String(p.careerStats.gp), helpers.round(p.careerStats.min, 1), helpers.round(p.careerStats.pts, 1), helpers.round(p.careerStats.trb, 1), helpers.round(p.careerStats.ast, 1), helpers.round(p.careerStats.per, 1), helpers.round(p.careerStats.ewa, 1), p.statsTids.indexOf(g.userTid) >= 0];
            }), {
                rowCallback: function (row, data) {
                    // Highlight players from the user's team
                    if (data[data.length - 1]) {
                        row.classList.add("info");
                    }
                }
            });
        }).extend({throttle: 1});

        ui.tableClickableRows($("#hall-of-fame"));
    }

    return bbgmView.init({
        id: "hallOfFame",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updatePlayers],
        uiFirst: uiFirst
    });
});