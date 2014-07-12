/**
 * @name views.powerRankings
 * @namespace Power Rankings based on player ratings, stats, team performance
 */
define(["globals", "ui", "core/team", "core/player", "lib/jquery", "lib/underscore", "lib/knockout", "lib/knockout.mapping", "views/components", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, team, player, $, _, ko, komapping, components, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    function get(req) {
        return {
            season: helpers.validateSeason(req.params.season)
        };
    }

    function InitViewModel() {
        this.season = ko.observable();
        this.teams = ko.observable([]);
    }

    mapping = {
        confs: {
            create: function (options) {
                return new function () {
                    komapping.fromJS(options.data, {
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
                    }, this);
                }();
            },
            key: function (data) {
                return ko.utils.unwrapObservable(data.name);
            }
        }
    };

    function updatePowerRankings(inputs, updateEvents, vm) {
        var deferred, tx;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("gameSim") >= 0 || inputs.season !== vm.season()) {
            deferred = $.Deferred();

            tx = g.dbl.transaction(["players", "teams", "releasedPlayers"]);

            team.filter({
                attrs: ["tid", "cid", "did", "abbrev", "region", "name"],
                seasonAttrs: ["won", "lost", "winp", "wonHome", "lostHome", "wonAway", "lostAway", "wonDiv", "lostDiv", "wonConf", "lostConf", "lastTen", "streak"],
                stats: ["gp", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "oppPts", "diff"],
                season: inputs.season,
                ot: tx
            }, function (teams) {
                // var confs, confRanks, confTeams, divTeams, i, j, k, l;
                var sortedTeams, teamRatings, weightedRatings, weightedStats, weightedRecord, i, j;

                teamRatings = {};

                tx.objectStore("players").index("tid").getAll(IDBKeyRange.lowerBound(0)).onsuccess = function (event) {
                    var i, players;

                    players = event.target.result;

                    // Get player ratings for all teams
                    for (i = 0; i < players.length; i++) {
                        var player = players[i];
                        var weightedRating = 0;
                        var rating = player.ratings[player.ratings.length-1].ovr;

                        if (player.rosterOrder < 5)
                            weightedRating = 0.12*rating;
                        else if (player.rosterOrder < 7)
                            weightedRating = 0.10*rating;
                        else if (player.rosterOrder < 10)
                            weightedRating = 0.05*rating;

                        teamRatings[player.tid] = (teamRatings[player.tid] ? teamRatings[player.tid] + weightedRating : weightedRating);
                    }

                    // Rank by weighted player ratings
                    weightedRatings = _.sortBy(teams, function(team){
                        team.weightedRating = teamRatings[team.tid];
                        return -team.weightedRating;
                    });

                    for (i = 0; i < weightedRatings.length; i++)
                        weightedRatings[i].ratingRank = i+1;

                    // Rank by weighted team stats
                    weightedStats = _.sortBy(teams, function(team){
                        team.weightedStats = team.pts+(2*team.trb)+(2*team.ast)+(3*team.stl)+(3*team.blk)-(2*team.pf)-team.oppPts+(2*team.diff);
                        return -team.weightedStats;
                    });

                    for (i = 0; i < weightedStats.length; i++)
                        weightedStats[i].statsRank = i+1;

                    // Rank by weighted team performance
                    weightedRecord = _.sortBy(teams, function(team){
                        var lastTenWon = team.lastTen.split("-")[0];
                        var lastTenLost = team.lastTen.split("-")[1];
                        team.weightedRecord = team.won-team.lost+lastTenWon-lastTenLost;
                        return -team.weightedRecord;
                    });

                    for (i = 0; i < weightedRecord.length; i++)
                        weightedRecord[i].recordRank = i+1;

                    sortedTeams = _.sortBy(teams, function(team){
                        if (team.tid === g.userTid)
                            team.highlight = true;
                        else
                            team.highlight = false;
                        return team.ratingRank+team.statsRank+team.recordRank;
                    });

                    for (i = 0; i < sortedTeams.length; i++)
                        sortedTeams[i].overallRank = i+1;

                    deferred.resolve({
                        season: inputs.season,
                        teams: sortedTeams
                    });
                }
            });

            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ko.computed(function () {
            ui.title("Power Rankings - " + vm.season());
        }).extend({throttle: 1});

        ui.tableClickableRows($("#power-rankings"));
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("power-rankings-dropdown", ["seasons"], [vm.season()], updateEvents);
    }

    return bbgmView.init({
        id: "powerRankings",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updatePowerRankings],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});