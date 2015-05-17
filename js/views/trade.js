/**
 * @name views.trade
 * @namespace Trade.
 */
define(["dao", "globals", "ui", "core/player", "core/trade", "lib/bluebird", "lib/davis", "lib/jquery", "lib/knockout", "lib/knockout.mapping", "lib/underscore", "util/bbgmView", "util/helpers"], function (dao, g, ui, player, trade, Promise, Davis, $, ko, komapping, _, bbgmView, helpers) {
    "use strict";

    var mapping;

    // This relies on vars being populated, so it can't be called in parallel with updateTrade
    function updateSummary(vars) {
        return trade.getOtherTid().then(function (otherTid) {
            var teams;

            teams = [
                {
                    tid: g.userTid,
                    pids: vars.userPids,
                    dpids: vars.userDpids
                },
                {
                    tid: otherTid,
                    pids: vars.otherPids,
                    dpids: vars.otherDpids
                }
            ];
            return trade.summary(teams).then(function (summary) {
                var i;

                vars.summary = {
                    enablePropose: !summary.warning && (teams[0].pids.length > 0 || teams[0].dpids.length > 0 || teams[1].pids.length > 0 || teams[1].dpids.length > 0),
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

                return vars;
            });
        });
    }

    // Validate that the stored player IDs correspond with the active team ID
    function validateSavedPids() {
        return trade.get().then(trade.updatePlayers);
    }

    function get(req) {
        if ((g.phase >= g.PHASE.AFTER_TRADE_DEADLINE && g.phase <= g.PHASE.PLAYOFFS) || g.phase === g.PHASE.FANTASY_DRAFT || g.gameOver) {
            return {
                errorMessage: "You're not allowed to make trades now."
            };
        }

        return {
            message: req.raw.message !== undefined ? req.raw.message : null
        };
    }

    function post(req) {
        var askButtonEl, newOtherTid, otherDpids, otherPids, out, pid, teams, userDpids, userPids;

        pid = req.params.pid !== undefined ? parseInt(req.params.pid, 10) : null;
        if (req.raw.abbrev !== undefined) {
            out = helpers.validateAbbrev(req.raw.abbrev);
            newOtherTid = out[0];
        } else if (req.params.tid !== undefined) {
            newOtherTid = parseInt(req.params.tid, 10);
        } else {
            newOtherTid = null;
        }

        userPids = req.params.userPids !== undefined && req.params.userPids.length > 0 ? _.map(req.params.userPids.split(","), function (x) { return parseInt(x, 10); }) : [];
        otherPids = req.params.otherPids !== undefined && req.params.otherPids.length > 0 ? _.map(req.params.otherPids.split(","), function (x) { return parseInt(x, 10); }) : [];
        userDpids = req.params.userDpids !== undefined && req.params.userDpids.length > 0 ? _.map(req.params.userDpids.split(","), function (x) { return parseInt(x, 10); }) : [];
        otherDpids = req.params.otherDpids !== undefined && req.params.otherDpids.length > 0 ? _.map(req.params.otherDpids.split(","), function (x) { return parseInt(x, 10); }) : [];

        teams = [
            {
                tid: g.userTid,
                pids: userPids,
                dpids: userDpids
            },
            {
                tid: newOtherTid,
                pids: otherPids,
                dpids: otherDpids
            }
        ];

        if (req.params.clear !== undefined) {
            // Clear trade
            trade.clear().then(function () {
                ui.realtimeUpdate([], helpers.leagueUrl(["trade"]));
            });
        } else if (req.params.propose !== undefined) {
            // Propose trade
            trade.propose(req.params.hasOwnProperty("force-trade")).get(1).then(function (message) {
                ui.realtimeUpdate([], helpers.leagueUrl(["trade"]), undefined, {message: message});
            });
        } else if (req.params.ask !== undefined) {
            // What would make this deal work?
            askButtonEl = document.getElementById("ask-button");
            askButtonEl.textContent = "Waiting for answer...";
            askButtonEl.disabled = true;
            trade.makeItWorkTrade().then(function (message) {
                ui.realtimeUpdate([], helpers.leagueUrl(["trade"]), undefined, {message: message});
                askButtonEl.textContent = "What would make this deal work?";
                askButtonEl.disabled = false;
            });
        } else if (pid !== null) {
            // Start new trade for a single player
            teams[1].pids = [pid];
            trade.create(teams).then(function () {
                ui.realtimeUpdate([], helpers.leagueUrl(["trade"]));
            });
        } else if (newOtherTid !== null || userPids.length > 0 || otherPids.length > 0 || userDpids.length > 0 || otherDpids.length > 0) {
            // Start a new trade based on a list of pids and dpids, like from the trading block
            trade.create(teams).then(function () {
                ui.realtimeUpdate([], helpers.leagueUrl(["trade"]));
            });
        }
    }

    function InitViewModel() {
        this.teams = ko.observable([]);
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

    function updateTrade(inputs) {
        var otherTid;

        return Promise.all([
            validateSavedPids(),
            dao.players.getAll({
                index: "tid",
                key: g.userTid,
                statsSeasons: [g.season]
            }),
            dao.draftPicks.getAll({
                index: "tid",
                key: g.userTid
            })
        ]).spread(function (teams, userRoster, userPicks) {
            var attrs, i, ratings, stats;

            attrs = ["pid", "name", "age", "contract", "injury", "watch", "gamesUntilTradable"];
            ratings = ["ovr", "pot", "skills", "pos"];
            stats = ["min", "pts", "trb", "ast", "per"];

            userRoster = player.filter(userRoster, {
                attrs: attrs,
                ratings: ratings,
                stats: stats,
                season: g.season,
                tid: g.userTid,
                showNoStats: true,
                showRookies: true,
                fuzz: true
            });
            userRoster = trade.filterUntradable(userRoster);

            for (i = 0; i < userRoster.length; i++) {
                if (teams[0].pids.indexOf(userRoster[i].pid) >= 0) {
                    userRoster[i].selected = true;
                } else {
                    userRoster[i].selected = false;
                }
            }

            for (i = 0; i < userPicks.length; i++) {
                userPicks[i].desc = helpers.pickDesc(userPicks[i]);
            }

            otherTid = teams[1].tid;

            // Need to do this after knowing otherTid
            return Promise.all([
                dao.players.getAll({
                    index: "tid",
                    key: otherTid,
                    statsSeasons: [g.season]
                }),
                dao.draftPicks.getAll({
                    index: "tid",
                    key: otherTid
                }),
                dao.teams.get({key: otherTid})
            ]).spread(function (otherRoster, otherPicks, t) {
                var i;

                otherRoster = player.filter(otherRoster, {
                    attrs: attrs,
                    ratings: ratings,
                    stats: stats,
                    season: g.season,
                    tid: otherTid,
                    showNoStats: true,
                    showRookies: true,
                    fuzz: true
                });
                otherRoster = trade.filterUntradable(otherRoster);

                for (i = 0; i < otherRoster.length; i++) {
                    if (teams[1].pids.indexOf(otherRoster[i].pid) >= 0) {
                        otherRoster[i].selected = true;
                    } else {
                        otherRoster[i].selected = false;
                    }
                }

                for (i = 0; i < otherPicks.length; i++) {
                    otherPicks[i].desc = helpers.pickDesc(otherPicks[i]);
                }

                return {
                    salaryCap: g.salaryCap / 1000,
                    userDpids: teams[0].dpids,
                    userPicks: userPicks,
                    userPids: teams[0].pids,
                    userRoster: userRoster,
                    otherDpids: teams[1].dpids,
                    otherPicks: otherPicks,
                    otherPids: teams[1].pids,
                    otherRoster: otherRoster,
                    message: inputs.message,
                    strategy: t.strategy,
                    won: t.seasons[t.seasons.length - 1].won,
                    lost: t.seasons[t.seasons.length - 1].lost,
                    godMode: g.godMode,
                    forceTrade: false
                };
            });
        }).then(updateSummary).then(function (vars) {
            // Always run this, for multi team mode
            vars.teams = helpers.getTeams(otherTid);
            vars.teams.splice(g.userTid, 1); // Can't trade with yourself
            vars.userTeamName = g.teamRegionsCache[g.userTid] + " " + g.teamNamesCache[g.userTid];

            // If the season is over, can't trade players whose contracts are expired
            if (g.phase > g.PHASE.PLAYOFFS && g.phase < g.PHASE.FREE_AGENCY) {
                vars.showResigningMsg = true;
            } else {
                vars.showResigningMsg = false;
            }

            return vars;
        });
    }

    function uiFirst(vm) {
        var rosterCheckboxesOther, rosterCheckboxesUser, tradeable;

        ui.title("Trade");

        // Don't use the dropdown function because this needs to be a POST
        $("#trade-select-team").change(function () {
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

        $("#rosters").on("click", "input", function () {
            vm.summary.enablePropose(false); // Will be reenabled in updateSummary, if appropriate
            vm.message("");

            trade.getOtherTid().then(function (otherTid) {
                var serialized, teams;

                serialized = $("#rosters").serializeArray();

                teams = [
                    {
                        tid: g.userTid,
                        pids: _.map(_.pluck(_.filter(serialized, function (o) { return o.name === "user-pids"; }), "value"), Math.floor),
                        dpids: _.map(_.pluck(_.filter(serialized, function (o) { return o.name === "user-dpids"; }), "value"), Math.floor)
                    },
                    {
                        tid: otherTid,
                        pids: _.map(_.pluck(_.filter(serialized, function (o) { return o.name === "other-pids"; }), "value"), Math.floor),
                        dpids: _.map(_.pluck(_.filter(serialized, function (o) { return o.name === "other-dpids"; }), "value"), Math.floor)
                    }
                ];

                trade.updatePlayers(teams).then(function (teams) {
                    var vars;

                    vars = {};
                    vars.userPids = teams[0].pids;
                    vars.otherPids = teams[1].pids;
                    vars.userDpids = teams[0].dpids;
                    vars.otherDpids = teams[1].dpids;

                    updateSummary(vars).then(function (vars) {
                        var found, i, j;

                        komapping.fromJS(vars, mapping, vm);

                        for (i = 0; i < rosterCheckboxesUser.length; i++) {
                            found = false;
                            for (j = 0; j < teams[0].pids.length; j++) {
                                if (Math.floor(rosterCheckboxesUser[i].value) === teams[0].pids[j]) {
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
                            for (j = 0; j < teams[1].pids.length; j++) {
                                if (Math.floor(rosterCheckboxesOther[i].value) === teams[1].pids[j]) {
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
        });

        tradeable = function (userOrOther, roster) {
            var playersAndPicks;

            playersAndPicks = _.map(roster, function (p) {
                var checkbox, disabled, selected;

                if (p.selected) {
                    selected = ' checked = "checked"';
                }
                if (p.untradable) {
                    disabled = ' disabled = "disabled"';
                }

                checkbox = '<input name="' + userOrOther + '-pids" type="checkbox" value="' + p.pid + '" title="' + p.untradableMsg + '"' + selected + disabled + '>';

                return [checkbox, helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.ratings.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp, helpers.round(p.stats.min, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.per, 1)];
            });

            return playersAndPicks;
        };

        ko.computed(function () {
            ui.datatableSinglePage($("#roster-user"), 5, tradeable("user", vm.userRoster()),
                                   {columnDefs: [{orderable: false, targets: [0]}]});
        }).extend({throttle: 1});

        ko.computed(function () {
            ui.datatableSinglePage($("#roster-other"), 5, tradeable("other", vm.otherRoster()),
                                   {columnDefs: [{orderable: false, targets: [0]}]});
        }).extend({throttle: 1});

        ui.tableClickableRows($("#roster-user"));
        ui.tableClickableRows($("#roster-other"));
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