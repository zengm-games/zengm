/**
 * @name views.teamFinances
 * @namespace Team finances.
 */
define(["db", "globals", "ui", "core/finances", "lib/jquery", "lib/knockout", "lib/knockout.mapping", "lib/underscore", "views/components", "util/helpers", "util/viewHelpers"], function (db, g, ui, finances, $, ko, mapping, _, components, helpers, viewHelpers) {
    "use strict";

    var vm;

    function disableFinanceSettings() {
        $("#finances-settings input, button").attr("disabled", "disabled");
        if (vm.tid() === g.userTid) {
            $("#finances-settings .text-error").html("Stop game simulation to edit.");
        } else {
            $("#finances-settings button").hide();
        }
    }

    function enableFinanceSettings() {
        $("#finances-settings button").html("Save Revenue and<br> Expense Settings");
        if (vm.tid() === g.userTid) {
            $("#finances-settings input, button").removeAttr("disabled");
            $("#finances-settings button").show();
        } else {
            $("#finances-settings input, button").attr("disabled", "disabled");
            $("#finances-settings button").hide();
        }
        $("#finances-settings .text-error").html("");
    }

    function loadAfter(cb) {
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
            [barData.revenues.nationalTv, barData.revenues.localTv, barData.revenues.ticket, barData.revenues.sponsor, barData.revenues.merch],
            undefined,
            [
                barSeasons,
                ["national TV revenue", "local TV revenue", "ticket revenue",  "corporate sponsorship revenue", "merchandising revenue"]
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

        ui.datatableSinglePage($("#player-salaries"), 1, _.map(vm.contracts(), function (p) {
            var i, output;
            output = [helpers.playerNameLabels(p.pid, p.name, p.injury, p.skills)];
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
        }));

        cb();
    }

    function display(updateEvents, cb) {
        var leagueContentEl;

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "teamFinances") {
            ui.update({
                container: "league_content",
                template: "teamFinances"
            });
            ko.applyBindings(vm, leagueContentEl);

            $("#help-payroll-limits").clickover({
                title: "Payroll Limits",
                content: "The salary cap is a soft cap, meaning that you can exceed it to resign your own players or to sign free agents to minimum contracts ($" + g.minContract + "k/year); however, you cannot exceed the salary cap to sign a free agent for more than the minimum. Teams with payrolls below the minimum payroll limit will be assessed a fine equal to the difference at the end of the season. Teams with payrolls above the luxury tax limit will be assessed a fine equal to " + g.luxuryTax + " times the difference at the end of the season."
            });

            $("#help-hype").clickover({
                title: "Hype",
                content: "\"Hype\" refers to fans' interest in your team. If your team is winning or improving, then hype increases; if your team is losing or stagnating, then hype decreases. Hype influences attendance, various revenue sources such as mercahndising, and the attitude players have towards your organization."
            });

            $("#help-revenue-settings").clickover({
                title: "Revenue Settings",
                content: "Set your ticket price too high, and attendance will decrease and some fans will resent you for it. Set it too low, and you're not maximizing your profit."
            });

            $("#help-expense-settings").clickover({
                title: "Expense Settings",
                html: true,
                content: "<p>Scouting: Controls the accuracy of displayed player ratings.<p></p>Coaching: Better coaches mean better player development.</p><p>Health: A good team of doctors speeds recovery from injuries.</p>Facilities: Better training facilities make your players happier and other players envious; stadium renovations increase attendance."
            });

            // Form enabling/disabling
            $("#finances-settings").on("gameSimulationStart", disableFinanceSettings);
            $("#finances-settings").on("gameSimulationStop", enableFinanceSettings);
        }
        ui.title(vm.team.region() + " " + vm.team.name() + " Finances");

        if (g.gamesInProgress) {
            disableFinanceSettings();
        } else {
            enableFinanceSettings();
        }

        components.dropdown("team-finances-dropdown", ["teams", "shows"], [vm.abbrev(), vm.show()], updateEvents);

        cb();
    }

    function loadBefore(abbrev, tid, show, cb) {
        db.getPayroll(null, tid, function (payroll, contracts) {
            var contractTotals, i, j, salariesSeasons, season, showInt;

            if (show === "all") {
                showInt = g.season - g.startingSeason + 1;
            } else {
                showInt = parseInt(show, 10);
            }

            payroll /= 1000;

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
                    contracts[i].amounts.push(contracts[i].amount / 1000);
                    contractTotals[j - season] += contracts[i].amount / 1000;
                }
                delete contracts[i].amount;
                delete contracts[i].exp;
            }
            salariesSeasons = [season, season + 1, season + 2, season + 3, season + 4];

            g.dbl.transaction("teams").objectStore("teams").get(tid).onsuccess = function (event) {
                var barData, barSeasons, i, keys, team, teamAll, tempData;

                team = event.target.result;
                team.seasons.reverse();  // Most recent season first

                keys = ["won", "hype", "pop", "att", "cash", "revenues", "expenses"];
                barData = {};
                for (i = 0; i < keys.length; i++) {
                    if (typeof team.seasons[0][keys[i]] !== "object") {
                        barData[keys[i]] = helpers.nullPad(_.pluck(team.seasons, keys[i]), showInt);
                    } else {
                        // Handle an object in the database
                        barData[keys[i]] = {};
                        tempData = _.pluck(team.seasons, keys[i]);
                        _.each(tempData[0], function (value, key, obj) {
                            barData[keys[i]][key] = helpers.nullPad(_.pluck(_.pluck(tempData, key), "amount"), showInt);
                        });
                    }
                }

                // Process some values
                barData.att = _.map(barData.att, function (num, i) { if (team.seasons[i] !== undefined) { return num / team.seasons[i].gp; } });  // per game
                keys = ["cash"];
                for (i = 0; i < keys.length; i++) {
                    barData[keys[i]] = _.map(barData[keys[i]], function (num) { return num / 1000; });  // convert to millions
                }

                barSeasons = [];
                for (i = 0; i < show; i++) {
                    barSeasons[i] = g.season - i;
                }

                // Get stuff for the finances form
                db.getTeam(team, g.season, ["region", "name", "abbrev", "budget"], [], ["expenses"], {}, function (team) {
                    vm.abbrev(abbrev);
                    vm.tid(tid);
                    vm.show(show);
                    vm.payroll(payroll);
                    vm.salariesSeasons(salariesSeasons);
                    vm.contracts(contracts);
                    vm.contractTotals(contractTotals);
                    vm.barData(barData);
                    vm.barSeasons(barSeasons);
                    mapping.fromJS({team: team}, {}, vm);

                    cb();
                });
            };
        });
    }

    function update(abbrev, tid, show, updateEvents, cb) {
        var leagueContentEl;
        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "teamFinances") {
            ko.cleanNode(leagueContentEl);
            vm = {
                abbrev: ko.observable(),
                tid: ko.observable(),
                show: ko.observable(),
                payroll: ko.observable(),
                aboveBelow: {},
                salaryCap: ko.observable(g.salaryCap / 1000),
                minPayroll: ko.observable(g.minPayroll / 1000),
                luxuryPayroll: ko.observable(g.luxuryPayroll / 1000),
                luxuryTax: ko.observable(g.luxuryTax),
                salariesSeasons: ko.observable([]),
                team: {},
                contracts: ko.observable(),
                contractTotals: ko.observable([]),
                barData: ko.observable(),
                barSeasons: ko.observable()
            };
            vm.aboveBelow.minPayroll = ko.computed(function () {
                return vm.payroll() > vm.minPayroll() ? "above" : "below";
            });
            vm.aboveBelow.salaryCap = ko.computed(function () {
                return vm.payroll() > vm.salaryCap() ? "above" : "below";
            });
            vm.aboveBelow.luxuryPayroll = ko.computed(function () {
                return vm.payroll() > vm.luxuryPayroll() ? "above" : "below";
            });
        }

        if (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || updateEvents.indexOf("teamFinances") >= 0 || tid !== vm.tid() || show !== vm.show()) {
            loadBefore(abbrev, tid, show, function () {
                display(updateEvents, function () {
                    loadAfter(cb);
                });
            });
        } else {
            display(updateEvents, cb);
        }
    }

    function get(req) {
        viewHelpers.beforeLeague(req, function (updateEvents, cb) {
            var abbrev, out, show, tid;

            show = req.params.show !== undefined ? req.params.show : "10";
            out = helpers.validateAbbrev(req.params.abbrev);
            tid = out[0];
            abbrev = out[1];

            update(abbrev, tid, show, updateEvents, cb);
        });
    }

    function post(req) {
        viewHelpers.beforeLeague(req, function (updateEvents, cb) {
            var tx;

            $("#finances-settings button").attr("disabled", "disabled").html("Saving...");

            tx = g.dbl.transaction("teams", "readwrite");
            tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                var budget, cursor, i, key, t;

                cursor = event.target.result;
                t = cursor.value;

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
                        t.budget[key].amount = budget[key];
                    }
                }

                cursor.update(t);

                finances.updateRanks(tx, ["budget"], function () {
                    ui.realtimeUpdate(["teamFinances"]);
                });
            };
        });
    }

    return {
        update: update,
        get: get,
        post: post
    };
});