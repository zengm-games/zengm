/**
 * @name views.negotiation
 * @namespace Contract negotiation.
 */
define(["db", "globals", "ui", "core/contractNegotiation", "lib/davis", "lib/jquery", "lib/knockout", "lib/underscore", "util/helpers", "util/viewHelpers"], function (db, g, ui, contractNegotiation, Davis, $, ko, _, helpers, viewHelpers) {
    "use strict";

    var vm;

    function displayNegotiation(error, pid, cb) {
        if (error !== undefined && error) {
            return helpers.error(error, cb);
        }

        g.dbl.transaction("negotiations").objectStore("negotiations").get(pid).onsuccess = function (event) {
            var negotiation;

            negotiation = event.target.result;

            if (!negotiation) {
                return helpers.error("No negotiation with player " + pid + " in progress.", cb);
            }

            negotiation.player.amount /= 1000;
            negotiation.team.amount /= 1000;
            negotiation.player.expiration = negotiation.player.years + g.season;
            // Adjust to account for in-season signings;
            if (g.phase <= g.PHASE.AFTER_TRADE_DEADLINE) {
                negotiation.player.expiration -= 1;
            }

            g.dbl.transaction("players").objectStore("players").get(pid).onsuccess = function (event) {
                var attributes, data, j, payroll, player, pr, ratings, stats, team, teams;

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

                teams = helpers.getTeams();
                team = {region: teams[g.userTid].region, name: teams[g.userTid].name};

                db.getPayroll(null, g.userTid, function (payroll) {
                    payroll /= 1000;

                    data = {
                        container: "league_content",
                        template: "negotiation",
                        title: "Contract Negotiation - " + player.name,
                        vars: {negotiation: negotiation, player: player, salaryCap: g.salaryCap / 1000, team: team, payroll: payroll}
                    };
                    ui.update(data);

                    cb();
                });
            };
        };
    }

    // Show the negotiations list if there are more ongoing negotiations
    function redirectNegotiationOrRoster(error, cancelled) {
        if (error !== undefined && error) {
            return helpers.error(error);
        }

        cancelled = cancelled !== undefined ? cancelled : false;

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

    function display(cb) {
        var leagueContentEl, rosterCheckboxesOther, rosterCheckboxesUser;

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "trade") {
            ui.update({
                container: "league_content",
                template: "trade"
            });
            ko.applyBindings(vm, document.getElementById("league_content"));
        }
        ui.title("Trade");
    }

    function loadBefore(message, cb) {
        cb();
    }

    function update(message, updateEvents, cb) {
        var leagueContentEl;

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "trade") {
            ko.cleanNode(leagueContentEl);
            vm = {
                salaryCap: ko.observable(g.salaryCap / 1000),
                payroll: ko.observable(),
                player: {
                    pid: ko.observable(),
                    name: ko.observable(),
                    ratings: ko.observable(), // Set later to obj
                    mood: ko.observable()
                },
                negotiation: {
                    team: {
                        amount: ko.observable(),
                        years: ko.observable()
                    },
                    player: ko.observable(), // Set later to obj
                    resigning: ko.observable()
                }
            };
            vm.summary = {
                enablePropose: ko.observable(false),
                warning: ko.observable(),
                teams: [
                    {
                        name: ko.observable(),
                        payrollAfterTrade: ko.observable(),
                        total: ko.observable(),
                        trade: ko.observable([])
                    },
                    {
                        name: ko.observable(),
                        payrollAfterTrade: ko.observable(),
                        total: ko.observable(),
                        trade: ko.observable([])
                    }
                ]
            };
            vm.summary.teams[0].other = vm.summary.teams[1];
            vm.summary.teams[1].other = vm.summary.teams[0];
        }

        loadBefore(message, function () {
            display(cb);
        });
    }

    function get(req) {
        viewHelpers.beforeLeague(req, function (updateEvents, cb) {
            var pid;

            pid = parseInt(req.params.pid, 10);

            displayNegotiation(undefined, pid, cb);
        });
    }

    function post(req) {
        viewHelpers.beforeLeague(req, function (updateEvents, cb) {
            var pid, teamAmountNew, teamYearsNew;

            pid = parseInt(req.params.pid, 10);

            if (req.params.hasOwnProperty("cancel")) {
                contractNegotiation.cancel(pid, function () {
                    redirectNegotiationOrRoster(undefined, true);
                });
            } else if (req.params.hasOwnProperty("accept")) {
                contractNegotiation.accept(pid, redirectNegotiationOrRoster);
            } else if (req.params.hasOwnProperty("new")) {
                // If there is no active negotiation with this pid, create it;
                g.dbl.transaction("negotiations").objectStore("negotiations").get(pid).onsuccess = function (event) {
                    var negotiation;

                    negotiation = event.target.result;

                    if (!negotiation) {
                        contractNegotiation.create(null, pid, false, function () {
                            Davis.location.assign(new Davis.Request("/l/" + g.lid + "/negotiation/" + pid));
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
        });
    }

    return {
        update: update,
        get: get,
        post: post
    };
});