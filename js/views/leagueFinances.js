/**
 * @name views.schedule
 * @namespace Show current schedule for user's team.
 */
define(["db", "globals", "ui", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers", "views/components"], function (db, g, ui, $, ko, _, bbgmView, helpers, viewHelpers, components) {
    "use strict";

    var mapping;

    function get(req) {
        return {
            season: helpers.validateSeason(req.params.season)
        };
    }

    function InitViewModel() {
        this.season = ko.observable();
    }

    mapping = {
        teams: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateLeagueFinances(inputs, updateEvents, vm) {
        var attributes, deferred, seasonAttributes, vars;

        if (updateEvents.indexOf("firstRun") >= 0 || inputs.season !== vm.season() || inputs.season === g.season) {
            deferred = $.Deferred();
            vars = {};

            attributes = ["tid", "abbrev", "region", "name"];
            seasonAttributes = ["att", "revenue", "profit", "cash", "payroll", "salaryPaid"];
            db.getTeams(null, inputs.season, attributes, [], seasonAttributes, {}, function (teams) {
                var i;

                for (i = 0; i < teams.length; i++) {
                    teams[i].cash /= 1000;  // [millions of dollars]
                }

                vars = {
                    season: inputs.season,
                    salaryCap: g.salaryCap / 1000,
                    minPayroll: g.minPayroll / 1000,
                    luxuryPayroll: g.luxuryPayroll / 1000,
                    luxuryTax: g.luxuryTax,
                    teams: teams
                };
                deferred.resolve(vars);
            });

            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ko.computed(function () {
            ui.title("League Finances - " + vm.season());
        });

        ko.computed(function () {
            var season;
            season = vm.season();
            ui.datatableSinglePage($("#league-finances"), 5, _.map(vm.teams(), function (t) {
                var payroll;
                payroll = season === g.season ? t.payroll : t.salaryPaid;  // Display the current actual payroll for this season, or the salary actually paid out for prior seasons
                return ['<a href="/l/' + g.lid + '/team_finances/' + t.abbrev + '">' + t.region + ' ' + t.name + '</a>', helpers.numberWithCommas(helpers.round(t.att)), helpers.formatCurrency(t.revenue, "M"), helpers.formatCurrency(t.profit, "M"), helpers.formatCurrency(t.cash, "M"), helpers.formatCurrency(payroll, "M")];
            }));
        }).extend({throttle: 1});
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("league-finances-dropdown", ["seasons"], [vm.season()], updateEvents);
    }

    return bbgmView.init({
        id: "leagueFinances",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updateLeagueFinances],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});