/**
 * @name views.negotiation
 * @namespace Contract negotiation.
 */
define(["db", "globals", "ui", "core/contractNegotiation", "lib/davis", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (db, g, ui, contractNegotiation, Davis, $, ko, _, bbgmView, helpers, viewHelpers) {
    "use strict";

    // Show the negotiations list if there are more ongoing negotiations
    function redirectNegotiationOrRoster(cancelled) {
        g.dbl.transaction("negotiations").objectStore("negotiations").getAll().onsuccess = function (event) {
            var negotiations;

            negotiations = event.target.result;

            if (negotiations.length > 0) {
                Davis.location.assign(new Davis.Request("/l/" + g.lid + "/negotiation"));
            } else if (cancelled) {
                Davis.location.assign(new Davis.Request("/l/" + g.lid + "/free_agents"));
            } else {
                Davis.location.assign(new Davis.Request("/l/" + g.lid + "/roster"));
            }
        };
    }

    function get(req) {
        return {
            pid: parseInt(req.params.pid, 10)
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
                    helpers.error(error);
                } else {
                    redirectNegotiationOrRoster(false);
                }
            });
        } else if (req.params.hasOwnProperty("new")) {
            // If there is no active negotiation with this pid, create it;
            g.dbl.transaction("negotiations").objectStore("negotiations").get(pid).onsuccess = function (event) {
                var negotiation;

                negotiation = event.target.result;

                if (!negotiation) {
                    contractNegotiation.create(null, pid, false, function (error) {
                        if (error !== undefined && error) {
                            helpers.error(error);
                        } else {
                            Davis.location.assign(new Davis.Request("/l/" + g.lid + "/negotiation/" + pid));
                        }
                    });
                } else {
                    Davis.location.assign(new Davis.Request("/l/" + g.lid + "/negotiation/" + pid));
                }
            };
        } else {
            // Make an offer to the player;
            teamAmountNew = parseInt(req.params.teamAmount * 1000, 10);
            teamYearsNew = parseInt(req.params.teamYears, 10);
            contractNegotiation.offer(pid, teamAmountNew, teamYearsNew, function () {
                Davis.location.assign(new Davis.Request("/l/" + g.lid + "/negotiation/" + pid));
            });
        }
    }

    function updateNegotiation(inputs, updateEvents, vm) {
        var deferred, vars;

        deferred = $.Deferred();
        vars = {};

        g.dbl.transaction("negotiations").objectStore("negotiations").get(inputs.pid).onsuccess = function (event) {
            var negotiation;

            negotiation = event.target.result;

            if (!negotiation) {
                return helpers.error("No negotiation with player " + inputs.pid + " in progress.");
            }

            negotiation.player.expiration = negotiation.player.years + g.season;
            // Adjust to account for in-season signings
            if (g.phase <= g.PHASE.AFTER_TRADE_DEADLINE) {
                negotiation.player.expiration -= 1;
            }

            g.dbl.transaction("players").objectStore("players").get(inputs.pid).onsuccess = function (event) {
                var attributes, player, ratings, stats, teams;

                attributes = ["pid", "name", "freeAgentMood"];
                ratings = ["ovr", "pot"];
                stats = [];
                player = db.getPlayer(event.target.result, g.season, null, attributes, stats, ratings, {showRookies: true, fuzz: true});

                if (player.freeAgentMood[g.userTid] < 0.25) {
                    player.mood = '<span class="text-success"><b>Eager to reach an agreement.</b></span>';
                } else if (player.freeAgentMood[g.userTid] < 0.5) {
                    player.mood = '<b>Willing to sign for the right price.</b>';
                } else if (player.freeAgentMood[g.userTid] < 0.75) {
                    player.mood = '<span class="text-warning"><b>Annoyed at you.</b></span>';
                } else {
                    player.mood = '<span class="text-error"><b>Insulted by your presence.</b></span>';
                }
                delete player.freeAgentMood;

                teams = helpers.getTeams();

                db.getPayroll(null, g.userTid, function (payroll) {
                    vars = {
                        salaryCap: g.salaryCap / 1000,
                        payroll: payroll / 1000,
                        team: {region: teams[g.userTid].region, name: teams[g.userTid].name},
                        player: player,
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
        });
    }

    return bbgmView.init({
        id: "negotiation",
        get: get,
        post: post,
        runBefore: [updateNegotiation],
        uiFirst: uiFirst
    });
});