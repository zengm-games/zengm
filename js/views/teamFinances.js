/**
 * @name views.teamFinances
 * @namespace Team finances.
 */
define(["dao", "globals", "ui", "core/finances", "core/team", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/bbgmView", "util/helpers"], function (dao, g, ui, finances, team, $, ko, _, components, bbgmView, helpers) {
    "use strict";

    var mapping;

    function disableFinanceSettings(tid) {
        $("#finances-settings input, #finances-settings button").attr("disabled", "disabled");
        if (tid === g.userTid) {
            $("#finances-settings .text-danger").html("Stop game simulation to edit.");
        } else {
            $("#finances-settings button").hide();
        }
    }

    function enableFinanceSettings(tid) {
        $("#finances-settings button").html("Save Revenue and<br> Expense Settings");
        if (tid === g.userTid) {
            $("#finances-settings input, #finances-settings button").removeAttr("disabled");
            $("#finances-settings button").show();
        } else {
            $("#finances-settings input, #finances-settings button").attr("disabled", "disabled");
            $("#finances-settings button").hide();
        }
        $("#finances-settings .text-danger").html("");
    }

    function get(req) {
        var inputs, out;

        inputs = {};

        inputs.show = req.params.show !== undefined ? req.params.show : "10";
        out = helpers.validateAbbrev(req.params.abbrev);
        inputs.tid = out[0];
        inputs.abbrev = out[1];

        return inputs;
    }

    function post(req) {
        var tx;

        $("#finances-settings button").attr("disabled", "disabled").html("Saving...");

        tx = dao.tx("teams", "readwrite");
        dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
            var budget, key;

            budget = req.params.budget;

            for (key in budget) {
                if (budget.hasOwnProperty(key)) {
                    if (key === "ticketPrice") {
                        // Already in [dollars]
                        budget[key] = parseFloat(helpers.round(budget[key], 2));
                    } else {
                        // Convert from [millions of dollars] to [thousands of dollars] rounded to the nearest $10k
                        budget[key] = helpers.round(budget[key] * 100) * 10;
                    }
                    if (budget[key] === budget[key]) { // NaN check
                        t.budget[key].amount = budget[key];
                    }
                }
            }

            return dao.teams.put({ot: tx, value: t});
        }).then(function () {
            return finances.updateRanks(tx, ["budget"]);
        }).then(function () {
            ui.realtimeUpdate(["teamFinances"]);
        });
    }

    function InitViewModel() {
        this.tid = ko.observable();
        this.show = ko.observable();
        this.payroll = ko.observable();
        this.salaryCap = ko.observable(g.salaryCap / 1000);
        this.minPayroll = ko.observable(g.minPayroll / 1000);
        this.luxuryPayroll = ko.observable(g.luxuryPayroll / 1000);
        this.luxuryTax = ko.observable(g.luxuryTax);

        this.aboveBelow = {};
        this.aboveBelow.minPayroll = ko.computed(function () {
            return this.payroll() > this.minPayroll() ? "above" : "below";
        }, this).extend({throttle: 1});
        this.aboveBelow.salaryCap = ko.computed(function () {
            return this.payroll() > this.salaryCap() ? "above" : "below";
        }, this).extend({throttle: 1});
        this.aboveBelow.luxuryPayroll = ko.computed(function () {
            return this.payroll() > this.luxuryPayroll() ? "above" : "below";
        }, this).extend({throttle: 1});
    }

    mapping = {
        barData: {
            create: function (options) {
                return ko.observable(options.data);
            }
        },
        contracts: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateTeamFinances(inputs, updateEvents, vm) {
        var vars;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || updateEvents.indexOf("teamFinances") >= 0 || inputs.tid !== vm.tid() || inputs.show !== vm.show()) {
            vars = {
                abbrev: inputs.abbrev,
                tid: inputs.tid,
                show: inputs.show
            };

            return team.getPayroll(null, inputs.tid).get(1).then(function (contracts) {
                var contractTotals, i, j, season, showInt;

                if (inputs.show === "all") {
                    showInt = g.season - g.startingSeason + 1;
                } else {
                    showInt = parseInt(inputs.show, 10);
                }

                // Convert contract objects into table rows
                contractTotals = [0, 0, 0, 0, 0];
                season = g.season;
                if (g.phase >= g.PHASE.DRAFT) {
                    // After the draft, don't show old contract year
                    season += 1;
                }
                for (i = 0; i < contracts.length; i++) {
                    contracts[i].amounts = [];
                    for (j = season; j <= contracts[i].exp; j++) {
                        // Only look at first 5 years (edited rosters might have longer contracts)
                        if (j - season >= 5) {
                            break;
                        }

                        contracts[i].amounts.push(contracts[i].amount / 1000);
                        contractTotals[j - season] += contracts[i].amount / 1000;
                    }
                    delete contracts[i].amount;
                    delete contracts[i].exp;
                }

                vars.contracts = contracts;
                vars.contractTotals = contractTotals;
                vars.salariesSeasons = [season, season + 1, season + 2, season + 3, season + 4];

                return dao.teams.get({key: inputs.tid}).then(function (t) {
                    var barData, barSeasons, i, keys, tempData;

                    t.seasons.reverse(); // Most recent season first

                    keys = ["won", "hype", "pop", "att", "cash", "revenues", "expenses"];
                    barData = {};
                    for (i = 0; i < keys.length; i++) {
                        if (typeof t.seasons[0][keys[i]] !== "object") {
                            barData[keys[i]] = helpers.nullPad(_.pluck(t.seasons, keys[i]), showInt);
                        } else {
                            // Handle an object in the database
                            barData[keys[i]] = {};
                            tempData = _.pluck(t.seasons, keys[i]);
                            _.each(tempData[0], function (value, key) {
                                barData[keys[i]][key] = helpers.nullPad(_.pluck(_.pluck(tempData, key), "amount"), showInt);
                            });
                        }
                    }

                    // account for added field
                    barData.revenues.luxuryTaxShare = barData.revenues.luxuryTaxShare || helpers.nullPad([0], showInt);

                    // Process some values
                    barData.att = _.map(barData.att, function (num, i) {
                        if (t.seasons[i] !== undefined) {
                            if (!t.seasons[i].hasOwnProperty("gpHome")) { t.seasons[i].gpHome = Math.round(t.seasons[i].gp / 2); } // See also game.js and team.js
                            if (t.seasons[i].gpHome > 0) {
                                return num / t.seasons[i].gpHome; // per game
                            }
                            return 0;
                        }
                    });
                    keys = ["cash"];
                    for (i = 0; i < keys.length; i++) {
                        barData[keys[i]] = _.map(barData[keys[i]], function (num) { return num / 1000; }); // convert to millions
                    }

                    barSeasons = [];
                    for (i = 0; i < showInt; i++) {
                        barSeasons[i] = g.season - i;
                    }

                    vars.barData = barData;
                    vars.barSeasons = barSeasons;
                });
            }).then(function () {
                // Get stuff for the finances form
                return team.filter({
                    attrs: ["region", "name", "abbrev", "budget"],
                    seasonAttrs: ["expenses", "payroll"],
                    season: g.season,
                    tid: inputs.tid
                }).then(function (t) {
                    vars.team = t;
                    vars.payroll = t.payroll; // For above/below observables

                    return vars;
                });
            });
        }
    }

    function uiFirst(vm) {
        ko.computed(function () {
            ui.title(vm.team.region() + " " + vm.team.name() + " Finances");
        }).extend({throttle: 1});

        $("#help-payroll-limits").popover({
            title: "Payroll Limits",
            content: "The salary cap is a soft cap, meaning that you can exceed it to re-sign your own players or to sign free agents to minimum contracts ($" + g.minContract + "k/year); however, you cannot exceed the salary cap to sign a free agent for more than the minimum. Teams with payrolls below the minimum payroll limit will be assessed a fine equal to the difference at the end of the season. Teams with payrolls above the luxury tax limit will be assessed a fine equal to " + g.luxuryTax + " times the difference at the end of the season."
        });

        $("#help-hype").popover({
            title: "Hype",
            content: "\"Hype\" refers to fans' interest in your team. If your team is winning or improving, then hype increases; if your team is losing or stagnating, then hype decreases. Hype influences attendance, various revenue sources such as mercahndising, and the attitude players have towards your organization."
        });

        $("#help-revenue-settings").popover({
            title: "Revenue Settings",
            content: "Set your ticket price too high, and attendance will decrease and some fans will resent you for it. Set it too low, and you're not maximizing your profit."
        });

        $("#help-expense-settings").popover({
            title: "Expense Settings",
            html: true,
            content: "<p>Scouting: Controls the accuracy of displayed player ratings.<p></p>Coaching: Better coaches mean better player development.</p><p>Health: A good team of doctors speeds recovery from injuries.</p>Facilities: Better training facilities make your players happier and other players envious; stadium renovations increase attendance."
        });

        // Form enabling/disabling
        $("#finances-settings").on("gameSimulationStart", function () {
            disableFinanceSettings(vm.tid());
        });
        $("#finances-settings").on("gameSimulationStop", function () {
            enableFinanceSettings(vm.tid());
        });

        ko.computed(function () {
            ui.datatableSinglePage($("#player-salaries"), 1, _.map(vm.contracts(), function (p) {
                var i, output;
                output = [helpers.playerNameLabels(p.pid, p.name, p.injury, p.skills, p.watch)];
                if (p.released) {
                    output[0] = "<i>" + output[0] + "</i>";
                }
                for (i = 0; i < 5; i++) {
                    if (p.amounts[i]) {
                        output.push(helpers.formatCurrency(p.amounts[i], "M"));
                    } else {
                        output.push("");
                    }
                    if (p.released) {
                        output[i + 1] = "<i>" + output[i + 1] + "</i>";
                    }
                }
                return output;
            }), {
                // This is needed to update the totals at the bottom. Knockout can't do it directly because (apparently) DataTables handles the whole table, even the tfoot.
                footerCallback: function (tfoot) {
                    var cells, contractTotals, i;

                    cells = tfoot.getElementsByTagName('th');
                    contractTotals = vm.contractTotals();

                    for (i = 0; i < contractTotals.length; i++) {
                        cells[i + 1].innerHTML = helpers.formatCurrency(contractTotals[i], "M");
                    }
                }
            });
        }).extend({throttle: 1});

        ui.tableClickableRows($("#player-salaries"));

        ko.computed(function () {
            var barData, barSeasons;

            barData = vm.barData();
            barSeasons = vm.barSeasons();

            $.barGraph($("#bar-graph-won"), barData.won, [0, 82], barSeasons);
            $.barGraph($("#bar-graph-hype"), barData.hype, [0, 1], barSeasons, function (val) {
                return helpers.round(val, 2);
            });
            $.barGraph($("#bar-graph-pop"), barData.pop, [0, 20], barSeasons, function (val) {
                return helpers.round(val, 1) + "M";
            });
            $.barGraph($("#bar-graph-att"), barData.att, [0, 25000], barSeasons, function (val) {
                return helpers.numberWithCommas(helpers.round(val));
            });

            $.barGraph(
                $("#bar-graph-revenue"),
                [barData.revenues.nationalTv, barData.revenues.localTv, barData.revenues.ticket, barData.revenues.sponsor, barData.revenues.merch, barData.revenues.luxuryTaxShare],
                undefined,
                [
                    barSeasons,
                    ["national TV revenue", "local TV revenue", "ticket revenue", "corporate sponsorship revenue", "merchandising revenue", "luxury tax share revenue"]
                ],
                function (val) {
                    return helpers.formatCurrency(val / 1000, "M", 1);
                }
            );
            $.barGraph(
                $("#bar-graph-expenses"),
                [barData.expenses.salary, barData.expenses.minTax, barData.expenses.luxuryTax, barData.expenses.buyOuts, barData.expenses.scouting, barData.expenses.coaching, barData.expenses.health, barData.expenses.facilities],
                undefined,
                [
                    barSeasons,
                    ["player salaries", "minimum payroll tax", "luxury tax", "buy outs", "scouting", "coaching", "health", "facilities"]
                ],
                function (val) {
                    return helpers.formatCurrency(val / 1000, "M", 1);
                }
            );
            $.barGraph($("#bar-graph-cash"), barData.cash, undefined, barSeasons, function (val) {
                return helpers.formatCurrency(val, "M", 1);
            });
        }).extend({throttle: 1});
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("team-finances-dropdown", ["teams", "shows"], [vm.abbrev(), vm.show()], updateEvents);

        if (g.gamesInProgress) {
            disableFinanceSettings(vm.tid());
        } else {
            enableFinanceSettings(vm.tid());
        }
    }

    return bbgmView.init({
        id: "teamFinances",
        get: get,
        post: post,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updateTeamFinances],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});
