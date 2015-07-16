/**
 * @name views.schedule
 * @namespace Show current schedule for user's team.
 */
define(["globals", "ui", "core/team", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers", "views/components", "dao", "lib/bluebird"], function (g, ui, team, $, ko, _, bbgmView, helpers, viewHelpers, components, dao, Promise) {
    "use strict";

    var mapping;

    function get(req) {
        return;
    }

    function InitViewModel() {

    }

    mapping = {
        teamRecords: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function getTeamLink(t) {
        return '<a href="' + helpers.leagueUrl(["team_history", t.abbrev]) + '">' + t.region + ' ' + t.name + '</a>'
    }

    function getTeamRecord(team) {
        var championships, i, j, playoffAppearances, totalLost, totalWon,
            totalWP, lastChampionship, lastPlayoffAppearance;

        totalWon = 0;
        totalLost = 0;
        playoffAppearances = 0;
        championships = 0;
        lastPlayoffAppearance = "-";
        lastChampionship = "-";
        for (i = 0; i < team.seasons.length; i++) {
            totalWon += team.seasons[i].won;
            totalLost += team.seasons[i].lost;
            if (team.seasons[i].playoffRoundsWon >= 0) {
                playoffAppearances += 1;
                lastPlayoffAppearance = team.seasons[i].season;
            }
            if (team.seasons[i].playoffRoundsWon === 4) {
                championships += 1;
                lastChampionship = team.seasons[i].season;
            }
        }

        totalWP = helpers.round(totalWon / (totalWon+totalLost), 4);

        var str = String;
        return {
            team: getTeamLink(team),
            won: totalWon.toString(),
            lost: totalLost.toString(),
            winp: totalWP.toString(),
            playoffAppearances: playoffAppearances.toString(),
            lastPlayoffAppearance: lastPlayoffAppearance.toString(),
            championships: championships.toString(),
            lastChampionship: lastChampionship.toString()
        };
    }

    function updateTeamRecords(inputs, updateEvents, vm) {
        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0) {
            return Promise.all([
                dao.teams.getAll()
            ]).spread(function (teams) {
                var teamRecords, i, j;

                teamRecords = [];
                for(i=0; i<teams.length; i++) {
                    teamRecords.push(getTeamRecord(teams[i]));
                }

                return {
                    teamRecords: teamRecords
                };
            });

        }
    }

    function uiFirst(vm) {
        ko.computed(function () {
            ui.title("Team Records");
        }).extend({throttle: 1});

        ko.computed(function () {

            var str = String
            ui.datatableSinglePage($("#team-records"), 0, _.map(vm.teamRecords(), function (t) {
                var out = [t.team, t.won, t.lost, t.winp, t.playoffAppearances, t.lastPlayoffAppearance, t.championships, t.lastChampionship];
                return out;
            }));

        }).extend({throttle: 1});

        ui.tableClickableRows($("#team-records"));
    }

    function uiEvery(updateEvents, vm) {

    }

    return bbgmView.init({
        id: "teamRecords",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updateTeamRecords],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});
