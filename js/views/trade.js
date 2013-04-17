/**
 * @name views.trade
 * @namespace Trade.
 */
define(["db", "globals", "ui", "core/trade", "lib/davis", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (db, g, ui, trade, Davis, $, ko, _, bbgmView, helpers, viewHelpers) {
    "use strict";

    function updateSummary(vm, cb) {
        var otherPids, userPids;

        otherPids = vm.otherPids();
        userPids = vm.userPids();

        trade.getOtherTid(function (otherTid) {
            trade.summary(otherTid, userPids, otherPids, function (summary) {
                var i;

                vm.summary.enablePropose(!summary.warning && (userPids.length > 0 || otherPids.length > 0));
                vm.summary.warning(summary.warning);

                for (i = 0; i < 2; i++) {
                    vm.summary.teams[i].name(summary.teams[i].name);
                    vm.summary.teams[i].payrollAfterTrade(summary.teams[i].payrollAfterTrade);
                    vm.summary.teams[i].total(summary.teams[i].total);
                    vm.summary.teams[i].trade(summary.teams[i].trade);
                }

                cb();
            });
        });
    }

    // Validate that the stored player IDs correspond with the active team ID
    function validateSavedPids(cb) {
        trade.getPlayers(function (userPids, otherPids) {
            trade.updatePlayers(userPids, otherPids, function (userPids, otherPids) {
                cb(userPids, otherPids);
            });
        });
    }

    function get(req) {
        if (g.phase >= g.PHASE.AFTER_TRADE_DEADLINE && g.phase <= g.PHASE.PLAYOFFS) {
            return helpers.error("You're not allowed to make trades now.", req);
        }

        return {
            message: req.raw.message !== undefined ? req.raw.message : null
        };
    }

    function post(req) {
        var newOtherTid, out, pid;

        pid = req.params.pid !== undefined ? parseInt(req.params.pid, 10) : null;
        if (req.raw.abbrev !== undefined) {
            out = helpers.validateAbbrev(req.raw.abbrev);
            newOtherTid = out[0];
        } else {
            newOtherTid = null;
        }

        if (req.params.clear !== undefined) {
            // Clear trade
            trade.clear(function () {
                return Davis.location.assign(new Davis.Request("/l/" + g.lid + "/trade"));
            });
        } else if (req.params.propose !== undefined) {
            // Propose trade
            trade.propose(function (accepted, message) {
                return Davis.location.assign(new Davis.Request("/l/" + g.lid + "/trade", {message: message}));
            });
        } else if (newOtherTid !== null || pid !== null) {
            // Start new trade with team or for player
            trade.create(newOtherTid, pid, function () {
                return Davis.location.assign(new Davis.Request("/l/" + g.lid + "/trade"));
            });
        }
    }

    function InitViewModel() {
        this.salaryCap = ko.observable(g.salaryCap / 1000);
        this.userPids = ko.observable([]);
        this.otherPids = ko.observable([]);
        this.userRoster = [];
        this.otherRoster = [];
        this.message = ko.observable();
        this.teams = [];
        this.userTeamName = undefined;
        this.summary = {
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
        this.summary.teams[0].other = this.summary.teams[1];
        this.summary.teams[1].other = this.summary.teams[0];
    }

    function updateTrade(inputs, updateEvents, vm) {
        var deferred, vars;

        deferred = $.Deferred();
        vars = {};

        validateSavedPids(function (userPids, otherPids) {
            trade.getOtherTid(function (otherTid) {
                var playerStore;

                playerStore = g.dbl.transaction("players").objectStore("players");

                playerStore.index("tid").getAll(g.userTid).onsuccess = function (event) {
                    var attributes, i, ratings, stats, userRoster;

                    attributes = ["pid", "name", "pos", "age", "contract", "injury"];
                    ratings = ["ovr", "pot", "skills"];
                    stats = ["min", "pts", "trb", "ast", "per"];
                    userRoster = db.getPlayers(event.target.result, g.season, g.userTid, attributes, stats, ratings, {showNoStats: true, fuzz: true});
                    for (i = 0; i < userRoster.length; i++) {
                        if (userPids.indexOf(userRoster[i].pid) >= 0) {
                            userRoster[i].selected = true;
                        } else {
                            userRoster[i].selected = false;
                        }
                    }

                    playerStore.index("tid").getAll(otherTid).onsuccess = function (event) {
                        var i, otherRoster, teams;

                        otherRoster = db.getPlayers(event.target.result, g.season, otherTid, attributes, stats, ratings, {showNoStats: true, fuzz: true});
                        for (i = 0; i < otherRoster.length; i++) {
                            if (otherPids.indexOf(otherRoster[i].pid) >= 0) {
                                otherRoster[i].selected = true;
                            } else {
                                otherRoster[i].selected = false;
                            }
                        }

                        vm.userPids(userPids);
                        vm.otherPids(otherPids);
                        vm.userRoster = userRoster;
                        vm.otherRoster = otherRoster;
                        vm.message(inputs.message);

                        updateSummary(vm, function () {
                            if (vm.teams.length === 0) {
                                teams = helpers.getTeams(otherTid);
                                vm.userTeamName = teams[g.userTid].region + " " + teams[g.userTid].name;
                                teams.splice(g.userTid, 1);  // Can't trade with yourself
                                vm.teams = teams;
                            }

                            deferred.resolve(vars);
                        });
                    };
                };
            });
        });

        return deferred.promise();
    }

    function uiFirst(vm) {
        ui.title("Trade");

        // Don't use the dropdown function because this needs to be a POST
        $('#trade-select-team').change(function (event) {
            Davis.location.replace(new Davis.Request({
                abbrev: $("#trade-select-team").val(),
                fullPath: "/l/" + g.lid + "/trade",
                method: "post"
            }));
        });


        $("#propose-trade button").click(function (event) {
            vm.summary.enablePropose(false); // Will be reenabled in updateSummary, if appropriate
        });
    }

    function uiEvery(updateEvents, vm) {
        var rosterCheckboxesOther, rosterCheckboxesUser;

        ui.datatableSinglePage($("#roster-user"), 5, _.map(vm.userRoster, function (p) {
            var selected;

            if (p.selected) {
                selected = ' checked = "checked"';
            }
            return ['<input name="user-pids" type="checkbox" value="' + p.pid + '"' + selected + '>', helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills), p.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp, helpers.round(p.stats.min, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.per, 1)];
        }));

        ui.datatableSinglePage($("#roster-other"), 5, _.map(vm.otherRoster, function (p) {
            var selected;

            if (p.selected) {
                selected = ' checked = "checked"';
            }
            return ['<input name="other-pids" type="checkbox" value="' + p.pid + '"' + selected + '>', helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills), p.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp, helpers.round(p.stats.min, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.per, 1)];
        }));

        rosterCheckboxesUser = $("#roster-user input");
        rosterCheckboxesOther = $("#roster-other input");

        $('#rosters input').click(function (event) {
            var otherPids, serialized, userPids;

            vm.summary.enablePropose(false); // Will be reenabled in updateSummary, if appropriate
            vm.message("");

            serialized = $("#rosters").serializeArray();
            userPids = _.map(_.pluck(_.filter(serialized, function (o) { return o.name === "user-pids"; }), "value"), Math.floor);
            otherPids = _.map(_.pluck(_.filter(serialized, function (o) { return o.name === "other-pids"; }), "value"), Math.floor);

            trade.updatePlayers(userPids, otherPids, function (userPids, otherPids) {
                vm.userPids(userPids);
                vm.otherPids(otherPids);

                updateSummary(vm, function () {
                    var found, i, j;

                    for (i = 0; i < rosterCheckboxesUser.length; i++) {
                        found = false;
                        for (j = 0; j < userPids.length; j++) {
                            if (Math.floor(rosterCheckboxesUser[i].value) === userPids[j]) {
                                rosterCheckboxesUser[i].checked = true;
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            rosterCheckboxesUser[i].checked = false;
                        }
                    }
                    for (i = 0; i < rosterCheckboxesOther.length; i++) {
                        found = false;
                        for (j = 0; j < otherPids.length; j++) {
                            if (Math.floor(rosterCheckboxesOther[i].value) === otherPids[j]) {
                                rosterCheckboxesOther[i].checked = true;
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            rosterCheckboxesOther[i].checked = false;
                        }
                    }
                });
            });
        });
    }

    return bbgmView.init({
        id: "trade",
        get: get,
        post: post,
        InitViewModel: InitViewModel,
        runBefore: [updateTrade],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});