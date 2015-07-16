/**
 * @name views.schedule
 * @namespace Show current schedule for user's team.
 */
define(["globals", "ui", "core/team", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers", "views/components", "dao", "lib/bluebird"], function (g, ui, team, $, ko, _, bbgmView, helpers, viewHelpers, components, dao, Promise) {
    "use strict";

    var mapping, optionsTmp, awardOptions;

    function get(req) {
        return {
            awardType: req.params.awardType || 'champion'
        };
    }

    function InitViewModel() {
        this.awardType = ko.observable();
        this.playerCount = ko.observable();
        this.awardTypeVal = ko.observable();
    }

    mapping = {
        awardsRecords: {
            create: function (options) {
                return options.data;
            }
        }
    };

    optionsTmp = [
        {
            val: "Won Championship",
            key: "champion"
        },
        {
            val: "Most Valuable Player",
            key: "mvp"
        },
        {
            val: "Finals MVP",
            key: "finals_mvp"
        },
        {
            val: "Defensive Player of the Year",
            key: "dpoy"
        },
        {
            val: "Sixth Man of the Year",
            key: "smoy"
        },
        {
            val: "Rookie of the Year",
            key: "roy"
        },
        {
            val: "First Team All-League",
            key: "first_team"
        },
        {
            val: "Second Team All-League",
            key: "second_team"
        },
        {
            val: "Third Team All-League",
            key: "third_team"
        },
        {
            val: "First Team All-Defensive",
            key: "first_def"
        },
        {
            val: "Second Team All-Defensive",
            key: "second_def"
        },
        {
            val: "Third Team All-Defensive",
            key: "third_def"
        }

    ];

    awardOptions = {}
    optionsTmp.map(function(o) {
        awardOptions[o.key] = o.val;
    })

    function getPlayerLink(p) {
        return '<a href="' + helpers.leagueUrl(["player", p.pid]) + '">' + p.name + '</a>';
    }

    function getPlayerAwards(p, awardType) {
        var aType, awards, years, last;
        aType = awardOptions[awardType];
        awards = p.awards.filter(function(a) {return a.type === aType});
        years = awards.map(function(a) {return a.season});
        last = years[years.length-1] || years;
        return {
            player: getPlayerLink(p),
            count: awards.length,
            countText: awards.length.toString(),
            years: years.join(', '),
            lastYear: last.toString()
        }
    }

    function updateAwardsRecords(inputs, updateEvents, vm) {
        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || inputs.awardType !== vm.awardType ) {
            return Promise.all([
                dao.players.getAll()
            ]).spread(function (players) {
                var awardsRecords, i, j;

                awardsRecords = [];
                players = players.filter(function(p) {return p.awards.length > 0 });
                for(i=0; i<players.length; i++) {
                    awardsRecords.push(getPlayerAwards(players[i], inputs.awardType))
                }
                awardsRecords = awardsRecords.filter(function(o) { return o.count > 0});

                return {
                    awardsRecords: awardsRecords,
                    playerCount: awardsRecords.length,
                    awardTypeVal: awardOptions[inputs.awardType],
                    awardType: inputs.awardType
                };
            });

        }
    }

    function uiFirst(vm) {
        ko.computed(function () {
            ui.title("Awards Records");
        }).extend({throttle: 1});

        ko.computed(function () {
            ui.datatableSinglePage($("#awards-records"), 0, _.map(vm.awardsRecords(), function (p) {
                return [p.player, p.countText, p.years, p.lastYear];
            }));

        }).extend({throttle: 1});

        ui.tableClickableRows($("#awards-records"));
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("awards-records-dropdown", ["awardType"], [vm.awardType()], updateEvents);
    }

    return bbgmView.init({
        id: "awardsRecords",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updateAwardsRecords],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});
