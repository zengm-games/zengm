/**
 * @name views.standings
 * @namespace Standings.
 */
define(["db", "globals", "ui", "lib/jquery", "lib/knockout", "lib/knockout.mapping", "views/components", "util/helpers", "util/viewHelpers"], function (db, g, ui, $, ko, mapping, components, helpers, viewHelpers) {
    "use strict";

    var vm;

    // Calculate the number of games that team is behind team0
    function gb(team0, team) {
        return ((team0.won - team0.lost) - (team.won - team.lost)) / 2;
    }

    function display(updateEvents, cb) {
        var leagueContentEl, season;

        season = vm.season();

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "standings") {
            ui.update({
                container: "league_content",
                template: "standings"
            });
            ko.applyBindings(vm, leagueContentEl);
        }
        ui.title("Standings - " + season);

        components.dropdown("standings-dropdown", ["seasons"], [season], updateEvents);

        cb();
    }

    function loadBefore(season, cb) {
        var attributes, seasonAttributes;

        attributes = ["tid", "cid", "did", "abbrev", "region", "name"];
        seasonAttributes = ["won", "lost", "winp", "wonHome", "lostHome", "wonAway", "lostAway", "wonDiv", "lostDiv", "wonConf", "lostConf", "lastTen", "streak"];
        db.getTeams(null, season, attributes, [], seasonAttributes, {sortBy: "winp"}, function (teams) {
            var confs, confTeams, data, divTeams, i, j, k, l, lastTenLost, lastTenWon, myMapping, NestedVm;

            confs = [];
            for (i = 0; i < g.confs.length; i++) {
                confTeams = [];
                l = 0;
                for (k = 0; k < teams.length; k++) {
                    if (g.confs[i].cid === teams[k].cid) {
                        confTeams.push(helpers.deepCopy(teams[k]));
                        confTeams[l].rank = l + 1;
                        if (l === 0) {
                            confTeams[l].gb = 0;
                        } else {
                            confTeams[l].gb = gb(confTeams[0], confTeams[l]);
                        }
                        l += 1;
                    }
                }

                confs.push({name: g.confs[i].name, divs: [], teams: confTeams});

                for (j = 0; j < g.divs.length; j++) {
                    if (g.divs[j].cid === g.confs[i].cid) {
                        divTeams = [];
                        l = 0;
                        for (k = 0; k < teams.length; k++) {
                            if (g.divs[j].did === teams[k].did) {
                                divTeams.push(helpers.deepCopy(teams[k]));
                                if (l === 0) {
                                    divTeams[l].gb = 0;
                                } else {
                                    divTeams[l].gb = gb(divTeams[0], divTeams[l]);
                                }
                                l += 1;
                            }
                        }

                        confs[i].divs.push({name: g.divs[j].name, teams: divTeams});
                    }
                }
            }

            data = {
                season: season,
                confs: confs
            };

            // I don't entirely understand this nested mapping, but it's based
            // on http://stackoverflow.com/a/12030524/786644
            NestedVm = function (data) {
                var myNestedMapping;

                myNestedMapping = {
                    divs: {
                        key: function (data) {
                            return ko.utils.unwrapObservable(data.name);
                        }
                    },
                    teams: {
                        key: function (data) {
                            return ko.utils.unwrapObservable(data.tid);
                        }
                    }
                };

                mapping.fromJS(data, myNestedMapping, this);
            };
            myMapping = {
                confs: {
                    create: function (options) {
                        return new NestedVm(options.data);
                    },
                    key: function (data) {
                        return ko.utils.unwrapObservable(data.name);
                    }
                }
            };
            mapping.fromJS(data, myMapping, vm);

            cb();
        });
    }

    function update(season, updateEvents, cb) {
        var leagueContentEl;

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "standings") {
            ko.cleanNode(leagueContentEl);
            vm = {
                season: ko.observable(),
                confs: ko.observable([])
            };
        }

        if ((season === g.season && updateEvents.indexOf("gameSim") >= 0) || season !== vm.season()) {
            loadBefore(season, function () {
                display(updateEvents, cb);
            });
        } else {
            display(updateEvents, cb);
        }
    }

    function get(req) {
        viewHelpers.beforeLeague(req, function (updateEvents, cb) {
            var season;

            season = helpers.validateSeason(req.params.season);

            update(season, updateEvents, cb);
        });
    }

    return {
        update: update,
        get: get
    };
});