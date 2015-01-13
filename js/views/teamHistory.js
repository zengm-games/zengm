/**
 * @name views.teamHistory
 * @namespace Team history.
 */
define(["dao", "globals", "ui", "core/player", "lib/bluebird", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers", "views/components"], function (dao, g, ui, player, Promise, $, ko, _, bbgmView, helpers, components) {
    "use strict";

    var mapping;

    function get(req) {
        var inputs, out;

        inputs = {};

        inputs.show = req.params.show !== undefined ? req.params.show : "10";
        out = helpers.validateAbbrev(req.params.abbrev);
        inputs.tid = out[0];
        inputs.abbrev = out[1];

        return inputs;
    }

    mapping = {
        history: {
            create: function (options) {
                return options.data;
            }
        },
        players: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateTeamHistory(inputs, updateEvents, vm) {
        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || inputs.abbrev !== vm.abbrev()) {
            return Promise.all([
                dao.teams.get({key: inputs.tid}),
                dao.players.getAll({
                    index: "statsTids",
                    key: inputs.tid,
                    statsSeasons: "all",
                    statsTid: inputs.tid
                })
            ]).spread(function (userTeam, players) {
                var championships, history, i, playoffAppearances, totalLost, totalWon;

                history = [];
                totalWon = 0;
                totalLost = 0;
                playoffAppearances = 0;
                championships = 0;
                for (i = 0; i < userTeam.seasons.length; i++) {
                    history.push({
                        season: userTeam.seasons[i].season,
                        won: userTeam.seasons[i].won,
                        lost: userTeam.seasons[i].lost,
                        playoffRoundsWon: userTeam.seasons[i].playoffRoundsWon
                    });
                    totalWon += userTeam.seasons[i].won;
                    totalLost += userTeam.seasons[i].lost;
                    if (userTeam.seasons[i].playoffRoundsWon >= 0) { playoffAppearances += 1; }
                    if (userTeam.seasons[i].playoffRoundsWon === 4) { championships += 1; }
                }
                history.reverse(); // Show most recent season first

                players = player.filter(players, {
                    attrs: ["pid", "name", "pos", "injury", "tid", "hof", "watch"],
                    stats: ["season","abbrev","gp", "min", "pts", "trb", "ast", "per", "ewa"],
                    tid: inputs.tid
                });

                for (i = 0; i < players.length; i++) {
                    delete players[i].ratings;
                }

                return {
                    abbrev: inputs.abbrev,
                    history: history,
                    players: players,
                    team: {
                        name: userTeam.name,
                        region: userTeam.region,
                        tid: inputs.tid
                    },
                    totalWon: totalWon,
                    totalLost: totalLost,
                    playoffAppearances: playoffAppearances,
                    championships: championships
                };
            });
        }
    }

    function uiFirst(vm) {
        ui.title("Team History");

        ko.computed(function () {
            ui.datatable($("#team-history-players"), 2, _.map(vm.players(), function (p) {
                var i, lastYr;

                p.stats.reverse();
               
                for (i = 0; i < p.stats.length; i++) {
                    if (p.stats[i].abbrev === vm.abbrev()) {
                        lastYr = p.stats[i].season + ' ';
                        break;
                    }
                }
                delete p.stats;
                return [helpers.playerNameLabels(p.pid, p.name, p.injury, [], p.watch), p.pos, String(p.careerStats.gp), helpers.round(p.careerStats.min, 1), helpers.round(p.careerStats.pts, 1), helpers.round(p.careerStats.trb, 1), helpers.round(p.careerStats.ast, 1), helpers.round(p.careerStats.per, 1), helpers.round(p.careerStats.ewa, 1), lastYr, p.hof, p.tid > g.PLAYER.RETIRED && p.tid !== vm.team.tid(), p.tid === vm.team.tid()];
            }), {
                rowCallback: function (row, data) {
                    // Highlight active players
                    if (data[data.length - 1]) {
                        row.classList.add("success"); // On this team
                    } else if (data[data.length - 2]) {
                        row.classList.add("info"); // On other team
                    } else if (data[data.length - 3]) {
                        row.classList.add("danger"); // Hall of Fame
                    }
                }
            });
        }).extend({throttle: 1});

        ui.tableClickableRows($("#team-history-players"));
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("team-history-dropdown", ["teams"], [vm.abbrev()], updateEvents);
    }

    return bbgmView.init({
        id: "teamHistory",
        get: get,
        mapping: mapping,
        runBefore: [updateTeamHistory],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});