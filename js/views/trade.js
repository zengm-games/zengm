/**
 * @name views.trade
 * @namespace Trade.
 */
define(["globals", "ui", "core/player", "core/trade", "lib/davis", "lib/jquery", "lib/knockout", "lib/knockout.mapping", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, player, trade, Davis, $, ko, komapping, _, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    // This relies on vars being populated, so it can't be called in parallel with updateTrade
    function updateSummary(vars, cb) {
        var otherPids, userPids;

        otherPids = vars.otherPids;
        userPids = vars.userPids;

        trade.getOtherTid(function (otherTid) {
            trade.summary(otherTid, userPids, otherPids, vars.userDpids, vars.otherDpids, function (summary) {
                var i;

                vars.summary = {
                    enablePropose: !summary.warning && (userPids.length > 0 || otherPids.length > 0),
                    warning: summary.warning
                };

                vars.summary.teams = [];
                for (i = 0; i < 2; i++) {
                    vars.summary.teams[i] = {
                        name: summary.teams[i].name,
                        payrollAfterTrade: summary.teams[i].payrollAfterTrade,
                        total: summary.teams[i].total,
                        trade: summary.teams[i].trade,
                        picks: summary.teams[i].picks,
                        other: i === 0 ? 1 : 0  // Index of other team
                    };
                }

                cb(vars);
            });
        });
    }

    // Validate that the stored player IDs correspond with the active team ID
    function validateSavedPids(cb) {
        trade.getPlayers(function (userPids, otherPids, userDpids, otherDpids) {
            trade.updatePlayers(userPids, otherPids, userDpids, otherDpids, function (userPids, otherPids, userDpids, otherDpids) {
                cb(userPids, otherPids, userDpids, otherDpids);
            });
        });
    }

    function get(req) {
        if (g.phase >= g.PHASE.AFTER_TRADE_DEADLINE && g.phase <= g.PHASE.PLAYOFFS) {
            return {
                errorMessage: "You're not allowed to make trades now."
            };
        }

        return {
            message: req.raw.message !== undefined ? req.raw.message : null
        };
    }

    function post(req) {
        var askButtonEl, newOtherTid, out, pid;

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
                ui.realtimeUpdate([], helpers.leagueUrl(["trade"]));
            });
        } else if (req.params.propose !== undefined) {
            // Propose trade
            trade.propose(function (accepted, message) {
                ui.realtimeUpdate([], helpers.leagueUrl(["trade"]), undefined, {message: message});
            });
        } else if (req.params.ask !== undefined) {
            // What would make this deal work?
            askButtonEl = document.getElementById("ask-button");
            askButtonEl.textContent = "Waiting for answer...";
            askButtonEl.disabled = true;
            trade.makeItWork(function (message) {
                ui.realtimeUpdate([], helpers.leagueUrl(["trade"]), undefined, {message: message});
                askButtonEl.textContent = "What would make you agree to this deal?";
                askButtonEl.disabled = false;
            });
        } else if (newOtherTid !== null || pid !== null) {
            // Start new trade with team or for player
            trade.create(newOtherTid, pid, function () {
                ui.realtimeUpdate([], helpers.leagueUrl(["trade"]));
            });
        }
    }

    function InitViewModel() {
        this.teams = [];
        this.userTeamName = undefined;
        this.summary = {
            enablePropose: ko.observable(false)
        };
    }

    mapping = {
        userPicks: {
            create: function (options) {
                return options.data;
            }
        },
        userRoster: {
            create: function (options) {
                return options.data;
            }
        },
        otherPicks: {
            create: function (options) {
                return options.data;
            }
        },
        otherRoster: {
            create: function (options) {
                return options.data;
            }
        },
        teams: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateTrade(inputs, updateEvents, vm) {
        var deferred, vars;

        deferred = $.Deferred();

        validateSavedPids(function (userPids, otherPids, userDpids, otherDpids) {
            trade.getOtherTid(function (otherTid) {
                var playerStore;

                playerStore = g.dbl.transaction("players").objectStore("players");

                playerStore.index("tid").getAll(g.userTid).onsuccess = function (event) {
                    var attrs, i, ratings, stats, userRoster;

                    attrs = ["pid", "name", "pos", "age", "contract", "injury"];
                    ratings = ["ovr", "pot", "skills"];
                    stats = ["min", "pts", "trb", "ast", "per"];

                    userRoster = player.filter(event.target.result, {
                        attrs: attrs,
                        ratings: ratings,
                        stats: stats,
                        season: g.season,
                        tid: g.userTid,
                        showNoStats: true,
                        showRookies: true,
                        fuzz: true
                    });
                    for (i = 0; i < userRoster.length; i++) {
                        if (userPids.indexOf(userRoster[i].pid) >= 0) {
                            userRoster[i].selected = true;
                        } else {
                            userRoster[i].selected = false;
                        }
                    }

                    playerStore.index("tid").getAll(otherTid).onsuccess = function (event) {
                        var draftPickStore, i, otherRoster, teams;

                        otherRoster = player.filter(event.target.result, {
                            attrs: attrs,
                            ratings: ratings,
                            stats: stats,
                            season: g.season,
                            tid: otherTid,
                            showNoStats: true,
                            showRookies: true,
                            fuzz: true
                        });
                        for (i = 0; i < otherRoster.length; i++) {
                            if (otherPids.indexOf(otherRoster[i].pid) >= 0) {
                                otherRoster[i].selected = true;
                            } else {
                                otherRoster[i].selected = false;
                            }
                        }

                        draftPickStore = g.dbl.transaction("draftPicks").objectStore("draftPicks");

                        draftPickStore.index("tid").getAll(g.userTid).onsuccess = function (event) {
                            var i, userPicks;

                            userPicks = event.target.result;
                            for (i = 0; i < userPicks.length; i++) {
                                userPicks[i].desc = userPicks[i].season + " " + (userPicks[i].round === 1 ? "first" : "second") + " round pick";
                                if (userPicks[i].tid !== userPicks[i].originalTid) {
                                    userPicks[i].desc += " (from " + userPicks[i].originalAbbrev + ")";
                                }
                            }

                            draftPickStore.index("tid").getAll(otherTid).onsuccess = function (event) {
                                var i, otherPicks;

                                otherPicks = event.target.result;
                                for (i = 0; i < otherPicks.length; i++) {
                                    otherPicks[i].desc = otherPicks[i].season + " " + (otherPicks[i].round === 1 ? "first" : "second") + " round pick";
                                    if (otherPicks[i].tid !== otherPicks[i].originalTid) {
                                        otherPicks[i].desc += " (from " + otherPicks[i].originalAbbrev + ")";
                                    }
                                }

                                vars = {
                                    salaryCap: g.salaryCap / 1000,
                                    userDpids: userDpids,
                                    userPicks: userPicks,
                                    userPids: userPids,
                                    userRoster: userRoster,
                                    otherDpids: otherDpids,
                                    otherPicks: otherPicks,
                                    otherPids: otherPids,
                                    otherRoster: otherRoster,
                                    message: inputs.message
                                };

                                updateSummary(vars, function (vars) {
                                    if (vm.teams.length === 0) {
                                        teams = helpers.getTeams(otherTid);
                                        vars.userTeamName = teams[g.userTid].region + " " + teams[g.userTid].name;
                                        teams.splice(g.userTid, 1);  // Can't trade with yourself
                                        vars.teams = teams;
                                    }

                                    deferred.resolve(vars);
                                });
                            };
                        };
                    };
                };
            });
        });

        return deferred.promise();
    }

    function uiFirst(vm) {
        var rosterCheckboxesOther, rosterCheckboxesUser, tradeable;

        ui.title("Trade");

        // Don't use the dropdown function because this needs to be a POST
        $("#trade-select-team").change(function (event) {
            // ui.realtimeUpdate currently can't handle a POST request
            Davis.location.replace(new Davis.Request({
                abbrev: $("#trade-select-team").val(),
                fullPath: helpers.leagueUrl(["trade"]),
                method: "post"
            }));
        });

        // This would disable the propose button when it's clicked, but it prevents form submission in Chrome.
        /*$("#propose-trade button").click(function (event) {
            vm.summary.enablePropose(false); // Will be reenabled in updateSummary, if appropriate
        });*/

        rosterCheckboxesUser = $("#roster-user input");
        rosterCheckboxesOther = $("#roster-other input");

        $("#rosters").on("click", "input", function (event) {
            var otherDpids, otherPids, serialized, userDpids, userPids;

            vm.summary.enablePropose(false); // Will be reenabled in updateSummary, if appropriate
            vm.message("");

            serialized = $("#rosters").serializeArray();
            userPids = _.map(_.pluck(_.filter(serialized, function (o) { return o.name === "user-pids"; }), "value"), Math.floor);
            otherPids = _.map(_.pluck(_.filter(serialized, function (o) { return o.name === "other-pids"; }), "value"), Math.floor);
            userDpids = _.map(_.pluck(_.filter(serialized, function (o) { return o.name === "user-dpids"; }), "value"), Math.floor);
            otherDpids = _.map(_.pluck(_.filter(serialized, function (o) { return o.name === "other-dpids"; }), "value"), Math.floor);

            trade.updatePlayers(userPids, otherPids, userDpids, otherDpids, function (userPids, otherPids, userDpids, otherDpids) {
                var vars;

                vars = {};
                vars.userPids = userPids;
                vars.otherPids = otherPids;
                vars.userDpids = userDpids;
                vars.otherDpids = otherDpids;

                updateSummary(vars, function (vars) {
                    var found, i, j;

                    komapping.fromJS(vars, mapping, vm);

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

        tradeable = function (userOrOther, roster) {
            var playersAndPicks;

            playersAndPicks = _.map(roster, function (p) {
                var selected;

                if (p.selected) {
                    selected = ' checked = "checked"';
                }
                return ['<input name="' + userOrOther + '-pids" type="checkbox" value="' + p.pid + '"' + selected + '>', helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills), p.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp, helpers.round(p.stats.min, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.per, 1)];
            });

            return playersAndPicks;
        };

        ko.computed(function () {
            ui.datatableSinglePage($("#roster-user"), 5, tradeable("user", vm.userRoster()));
        }).extend({throttle: 1});

        ko.computed(function () {
            ui.datatableSinglePage($("#roster-other"), 5, tradeable("other", vm.otherRoster()));
        }).extend({throttle: 1});
    }

    return bbgmView.init({
        id: "trade",
        get: get,
        post: post,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updateTrade],
        uiFirst: uiFirst
    });
});