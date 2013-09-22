/**
 * @name views.singleGame
 * @namespace Simulate a single game and display output in CSV format.
 */
define(["globals", "ui", "core/game", "core/gameSim", "core/player", "lib/jquery", "lib/knockout", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, game, gameSim, player, $, ko, bbgmView, helpers, viewHelpers) {
    "use strict";

    function get(req) {
        return {
            result: req.raw.result
        };
    }

    function post(req) {
        var buttonEl;

        buttonEl = document.getElementById("simulate-game");
        buttonEl.textContent = "Simulating...";
        buttonEl.disabled = true;

        game.loadTeams(g.dbl.transaction(["players", "teams"]), function (teams) {
            var gs, result;

            teams.sort(function (a, b) {  return a.id - b.id; });  // Order teams by tid
            gs = new gameSim.GameSim(666, teams[parseInt(req.params["tid-home"], 10)], teams[parseInt(req.params["tid-away"], 10)]);
            result = gs.run();

            ui.realtimeUpdate(["singleGameSim"], helpers.leagueUrl(["single_game"]), function () {
                buttonEl.textContent = "Simulate Game";
                buttonEl.disabled = false;
            }, {
                result: result
            });
        });
    }

    function InitViewModel() {
        this.csv = ko.observable("");
    }

    function updateForm() {}

    function updateResults(inputs, updateEvents, vm) {
        var csv, i, injuries, injury, j, p, r, t, deferred;

        if (updateEvents.indexOf("singleGameSim") >= 0) {
            deferred = $.Deferred();

            csv = "";
            injuries = [];
            r = inputs.result;

            for (i = 0; i < r.team.length; i++) {
                t = r.team[i];
                csv += g.teamRegionsCache[t.id] + "," + t.stat.ptsQtrs.join(",") + "," + t.stat.pts + "\n";
            }
            csv += "\n";

            for (i = 0; i < r.team.length; i++) {
                t = r.team[i];

                csv += g.teamRegionsCache[t.id] + "\n";
                csv += ["Name", "Pos", "Min", "FGM", "FGA", "3PtM", "3PtA", "FTM", "FTA", "Off", "Reb", "Ast", "TO", "Stl", "Blk", "PF", "Pts"].join(",") + "\n";

                for (j = 0; j < t.player.length; j++) {
                    p = t.player[j];
                    csv += [p.name, p.pos, helpers.round(p.stat.min, 1), p.stat.fg, + p.stat.fga, p.stat.tp, + p.stat.tpa, p.stat.ft, + p.stat.fta, p.stat.orb, p.stat.orb + p.stat.drb, p.stat.ast, p.stat.tov, p.stat.stl, p.stat.blk, p.stat.pf, p.stat.pts].join(",") + "\n";
                    if (p.injured) {
                        injury = player.injury(15);
                        injuries.push(p.name + " was injured (" + injury.type + ") and will miss " + injury.gamesRemaining + " games.");
                    }
                }

                csv += ["Total", "", helpers.round(t.stat.min), t.stat.fg, t.stat.fga, t.stat.tp, t.stat.tpa, t.stat.ft, t.stat.fta, t.stat.orb, t.stat.orb + t.stat.drb, t.stat.ast, t.stat.tov, t.stat.stl, t.stat.blk, t.stat.pf, t.stat.pts].join(",") + "\n";

                csv += "\n";
            }

            if (injuries.length > 0) {
                csv += "Injuries\n";
                csv += injuries.join("\n");
            }

            $("#download-link").html('<a href="data:application/json;base64,' + window.btoa(csv) + '" download="boxscore-' + r.team[0].id + '-' + r.team[1].id + '.csv">Download CSV</a>');

            deferred.resolve({
                csv: csv
            });

            return deferred.promise();
        }
    }

    function uiFirst() {
        ui.title("Single Game Simulation");
    }

    return bbgmView.init({
        id: "singleGame",
        get: get,
        post: post,
        InitViewModel: InitViewModel,
        runBefore: [updateForm, updateResults],
        uiFirst: uiFirst
    });
});