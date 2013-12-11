/**
 * @name views.negotiation
 * @namespace Contract negotiation.
 */
define(["db", "globals", "ui", "core/contractNegotiation", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (db, g, ui, contractNegotiation, player, $, ko, _, bbgmView, helpers, viewHelpers) {
    "use strict";

    // Show the negotiations list if there are more ongoing negotiations
    function redirectNegotiationOrRoster(cancelled) {
        g.dbl.transaction("negotiations").objectStore("negotiations").getAll().onsuccess = function (event) {
            var negotiations;

            negotiations = event.target.result;

            if (negotiations.length > 0) {
                ui.realtimeUpdate([], helpers.leagueUrl(["negotiation"]));
            } else if (cancelled) {
                ui.realtimeUpdate([], helpers.leagueUrl(["free_agents"]));
            } else {
                ui.realtimeUpdate([], helpers.leagueUrl(["roster"]));
            }
        };
    }

    function get(req) {
        var pid;

        pid = parseInt(req.params.pid, 10);

        return {
            pid: pid >= 0 ? pid : null // Null will load whatever the active one is
        };
    }

    function post(req) {
        var pid, teamAmountNew, teamYearsNew;

        pid = parseInt(req.params.pid, 10);

        if (req.params.hasOwnProperty("cancel")) {
            contractNegotiation.cancel(pid, function () {
                redirectNegotiationOrRoster(true);
            });
        } else if (req.params.hasOwnProperty("accept")) {
            contractNegotiation.accept(pid, function (error) {
                if (error !== undefined && error) {
                    helpers.errorNotify(error);
                    redirectNegotiationOrRoster(false);
                } else {
                    redirectNegotiationOrRoster(false);
                }
            });
        } else if (req.params.hasOwnProperty("new")) {
            // If there is no active negotiation with this pid, create it
            g.dbl.transaction("negotiations").objectStore("negotiations").get(pid).onsuccess = function (event) {
                var negotiation;

                negotiation = event.target.result;

                if (!negotiation) {
                    contractNegotiation.create(null, pid, false, function (error) {
                        if (error !== undefined && error) {
                            helpers.errorNotify(error);
                            ui.realtimeUpdate([], helpers.leagueUrl(["free_agents"]));
                        } else {
                            ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
                        }
                    });
                } else {
                    ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
                }
            };
        } else {
            // Make an offer to the player;
            teamAmountNew = parseInt(req.params.teamAmount * 1000, 10);
            teamYearsNew = parseInt(req.params.teamYears, 10);
            contractNegotiation.offer(pid, teamAmountNew, teamYearsNew, function () {
                ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
            });
        }
    }

    function updateNegotiation(inputs, updateEvents, vm) {
        var deferred, vars;

        deferred = $.Deferred();
        vars = {};

        g.dbl.transaction("negotiations").objectStore("negotiations").openCursor(inputs.pid).onsuccess = function (event) {
            var negotiation;

            negotiation = event.target.result.value;

            if (!negotiation) {
                return deferred.resolve({
                    errorMessage: "No negotiation with player " + inputs.pid + " in progress."
                });
            }

            negotiation.player.expiration = negotiation.player.years + g.season;
            // Adjust to account for in-season signings
            if (g.phase <= g.PHASE.AFTER_TRADE_DEADLINE) {
                negotiation.player.expiration -= 1;
            }

            g.dbl.transaction("players").objectStore("players").get(negotiation.pid).onsuccess = function (event) {
                var p;

                p = player.filter(event.target.result, {
                    attrs: ["pid", "name", "freeAgentMood"],
                    ratings: ["ovr", "pot"],
                    season: g.season,
                    showNoStats: true,
                    showRookies: true,
                    fuzz: true
                });

                // See views.freeAgents for moods as well
                if (p.freeAgentMood[g.userTid] < 0.25) {
                    p.mood = '<span class="text-success"><b>Eager to reach an agreement.</b></span>';
                } else if (p.freeAgentMood[g.userTid] < 0.5) {
                    p.mood = '<b>Willing to sign for the right price.</b>';
                } else if (p.freeAgentMood[g.userTid] < 0.75) {
                    p.mood = '<span class="text-warning"><b>Annoyed at you.</b></span>';
                } else {
                    p.mood = '<span class="text-danger"><b>Insulted by your presence.</b></span>';
                }
                delete p.freeAgentMood;

                db.getPayroll(null, g.userTid, function (payroll) {
                    vars = {
                        salaryCap: g.salaryCap / 1000,
                        payroll: payroll / 1000,
                        team: {region: g.teamRegionsCache[g.userTid], name: g.teamNamesCache[g.userTid]},
                        player: p,
                        negotiation: {
                            team: {
                                amount: negotiation.team.amount / 1000,
                                years: negotiation.team.years
                            },
                            player: {
                                amount: negotiation.player.amount / 1000,
                                expiration: negotiation.player.expiration,
                                years: negotiation.player.years
                            },
                            resigning: negotiation.resigning
                        }
                    };

                    deferred.resolve(vars);
                });
            };
        };

        return deferred.promise();
    }

    function uiFirst(vm) {
        ko.computed(function () {
            ui.title("Contract Negotiation - " + vm.player.name());
        }).extend({throttle: 1});
    }

    return bbgmView.init({
        id: "negotiation",
        get: get,
        post: post,
        runBefore: [updateNegotiation],
        uiFirst: uiFirst
    });
});