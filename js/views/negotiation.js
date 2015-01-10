/**
 * @name views.negotiation
 * @namespace Contract negotiation.
 */
define(["dao", "globals", "ui", "core/contractNegotiation", "core/player", "core/team", "lib/knockout", "util/bbgmView", "util/helpers"], function (dao, g, ui, contractNegotiation, player, team, ko, bbgmView, helpers) {
    "use strict";

    // Show the negotiations list if there are more ongoing negotiations
    function redirectNegotiationOrRoster(cancelled) {
        dao.negotiations.getAll().then(function (negotiations) {
            if (negotiations.length > 0) {
                ui.realtimeUpdate([], helpers.leagueUrl(["negotiation"]));
            } else if (cancelled) {
                ui.realtimeUpdate([], helpers.leagueUrl(["free_agents"]));
            } else {
                ui.realtimeUpdate([], helpers.leagueUrl(["roster"]));
            }
        });
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
            contractNegotiation.cancel(pid).then(function () {
                redirectNegotiationOrRoster(true);
            });
        } else if (req.params.hasOwnProperty("accept")) {
            contractNegotiation.accept(pid).then(function (error) {
                if (error !== undefined && error) {
                    helpers.errorNotify(error);
                }
                redirectNegotiationOrRoster(false);
            });
        } else if (req.params.hasOwnProperty("new")) {
            // If there is no active negotiation with this pid, create it
            dao.negotiations.get({key: pid}).then(function (negotiation) {
                var tx;
                if (!negotiation) {
                    tx = dao.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite");
                    contractNegotiation.create(tx, pid, false).then(function (error) {
                        tx.complete().then(function () {
                            if (error !== undefined && error) {
                                helpers.errorNotify(error);
                                ui.realtimeUpdate([], helpers.leagueUrl(["free_agents"]));
                            } else {
                                ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
                            }
                        });
                    });
                } else {
                    ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
                }
            });
        } else {
            // Make an offer to the player;
            teamAmountNew = parseInt(req.params.teamAmount * 1000, 10);
            teamYearsNew = parseInt(req.params.teamYears, 10);

            // Any NaN?
            if (teamAmountNew !== teamAmountNew || teamYearsNew !== teamYearsNew) {
                ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
            } else {
                contractNegotiation.offer(pid, teamAmountNew, teamYearsNew).then(function () {
                    ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
                });
            }
        }
    }

    function updateNegotiation(inputs) {
        // Call getAll so it works on null key
        return dao.negotiations.getAll({key: inputs.pid}).then(function (negotiations) {
            var negotiation;

            if (negotiations.length === 0) {
                return {
                    errorMessage: "No negotiation with player " + inputs.pid + " in progress."
                };
            }

            negotiation = negotiations[0];

            negotiation.player.expiration = negotiation.player.years + g.season;
            // Adjust to account for in-season signings
            if (g.phase <= g.PHASE.AFTER_TRADE_DEADLINE) {
                negotiation.player.expiration -= 1;
            }

            // Can't flatten more because of the return errorMessage above
            return dao.players.get({
                key: negotiation.pid
            }).then(function (p) {
                p = player.filter(p, {
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

                return team.getPayroll(null, g.userTid).get(0).then(function (payroll) {
                    return {
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
                });
            });
        });
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