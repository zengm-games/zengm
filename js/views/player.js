/**
 * @name views.player
 * @namespace View a single message.
 */
define(["db", "globals", "ui", "core/freeAgents", "lib/faces", "lib/jquery", "lib/knockout", "lib/knockout.mapping", "util/bbgmView", "util/viewHelpers"], function (db, g, ui, freeAgents, faces, $, ko, komapping, bbgmView, viewHelpers) {
    "use strict";

    var mapping;

    function get(req) {
        return {
            pid: req.params.pid !== undefined ? parseInt(req.params.pid, 10) : undefined
        };
    }

    mapping = {
        player: {
            create: function (options) {
                return new function () {
                    komapping.fromJS(options.data, {
                        face: {
                            create: function (options) {
console.log('mapping');
console.log(options.data);
                                return ko.observable(options.data);
                            }
                        }
                    }, this);
                }();
            }
        }
    };

    function updatePlayer(inputs) {
        var deferred, vars;

        deferred = $.Deferred();
        vars = {};

        g.dbl.transaction("players").objectStore("players").get(inputs.pid).onsuccess = function (event) {
            var attributes, currentRatings, data, player, ratings, stats;

            attributes = ["pid", "name", "tid", "abbrev", "teamRegion", "teamName", "pos", "age", "hgtFt", "hgtIn", "weight", "born", "contract", "draft", "face", "mood", "injury", "salaries", "salariesTotal", "awards", "freeAgentMood"];
            ratings = ["season", "abbrev", "age", "ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb", "skills"];
            stats = ["season", "abbrev", "age", "gp", "gs", "min", "fg", "fga", "fgp", "fgAtRim", "fgaAtRim", "fgpAtRim", "fgLowPost", "fgaLowPost", "fgpLowPost", "fgMidRange", "fgaMidRange", "fgpMidRange", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "per"];

            player = db.getPlayer(event.target.result, null, null, attributes, stats, ratings, {playoffs: true, showNoStats: true, fuzz: true});

            if (player.tid === g.PLAYER.RETIRED) {
                g.realtimeUpdate = false;
            }

            // Account for extra free agent demands
            if (player.tid === g.PLAYER.FREE_AGENT) {
                player.contract.amount = freeAgents.amountWithMood(player.contract.amount, player.freeAgentMood[g.userTid]);
            }

            currentRatings = player.ratings[player.ratings.length - 1];

            vars = {
                player: player,
                currentRatings: currentRatings,
                showTradeFor: player.tid !== g.userTid && player.tid >= 0,
                freeAgent: player.tid === g.PLAYER.FREE_AGENT,
                retired: player.tid === g.PLAYER.RETIRED,
                showContract: player.tid !== g.PLAYER.UNDRAFTED && player.tid !== g.PLAYER.RETIRED,
                injured: player.injury.type !== "Healthy"
            };

            deferred.resolve(vars);
        };


        return deferred.promise();
    }

    function uiFirst(vm) {
        ko.computed(function () {
            ui.title(vm.player.name());
        }).extend({throttle: 1});

        ko.computed(function () {
console.log(vm.player.face())
            faces.display("picture", vm.player.face());
        }).extend({throttle: 1});
    }

    return bbgmView.init({
        id: "player",
        get: get,
        mapping: mapping,
        runBefore: [updatePlayer],
        uiFirst: uiFirst
    });
});