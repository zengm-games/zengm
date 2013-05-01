/**
 * @name api
 * @namespace Functions called directly in response to user action (clicking a button, etc).
 */
define(["db", "globals", "views", "ui", "core/draft", "core/finances", "core/game", "core/player", "core/season", "core/team", "core/trade", "lib/handlebars.runtime", "lib/jquery", "lib/underscore", "util/lock"], function (db, g, views, ui, draft, finances, game, player, season, team, trade, Handlebars, $, _, lock) {
    "use strict";

    function play(amount) {
        var numDays;

        if (['day', 'week', 'month', 'throughPlayoffs'].indexOf(amount) >= 0) {
            // Start playing games
            if (amount === "day") {
                numDays = 1;
            } else if (amount === "week") {
                numDays = 7;
            } else if (amount === "month") {
                numDays = 30;
            } else if (amount === "throughPlayoffs") {
                numDays = 100;  // There aren't 100 days in the playoffs, so 100 will cover all the games and the sim stops when the playoffs end
            }

            game.play(numDays, true);
        } else if (amount === "untilPlayoffs") {
            if (g.phase < g.PHASE.PLAYOFFS) {
/*                season.getSchedule(null, 0, function (schedule) {
                    numDays = Math.floor(2 * schedule.length / (g.numTeams));
                    game.play(numDays, true);
                });*/
                game.play(100, true);
            }
        } else if (amount === "stop") {
            db.setGameAttributes({stopGames: true}, function () {
                // This is needed because we can't be sure if core.game.play will be called again
                ui.updateStatus("Idle");
                db.setGameAttributes({gamesInProgress: false}, ui.updatePlayMenu);
            });
        } else if (amount === "untilDraft") {
            if (g.phase === g.PHASE.BEFORE_DRAFT) {
                season.newPhase(g.PHASE.DRAFT, function () {
                    draft.genPlayers(function () {
                        draft.genOrder(function () {
                            ui.realtimeUpdate([], "/l/" + g.lid + "/draft");
                        });
                    });
                });
            }
        } else if (amount === "untilResignPlayers") {
            if (g.phase === g.PHASE.AFTER_DRAFT) {
                season.newPhase(g.PHASE.RESIGN_PLAYERS);
            }
        } else if (amount === "untilFreeAgency") {
            if (g.phase === g.PHASE.RESIGN_PLAYERS) {
                season.newPhase(g.PHASE.FREE_AGENCY, function () {
                    ui.updateStatus("Idle");
                });
            }
        } else if (amount === "untilPreseason") {
            if (g.phase === g.PHASE.FREE_AGENCY) {
                season.newPhase(g.PHASE.PRESEASON);
            }
        } else if (amount === "untilRegularSeason") {
            if (g.phase === g.PHASE.PRESEASON) {
                season.newPhase(g.PHASE.REGULAR_SEASON);
            }
        }
    }

    function playMenuHandlers() {
    }

    return {
        play: play,
        playMenuHandlers: playMenuHandlers
    };
});