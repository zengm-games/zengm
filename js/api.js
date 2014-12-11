/**
 * @name api
 * @namespace Functions called directly in response to user action (clicking a button, etc).
 */
define(["dao", "db", "globals", "ui", "core/freeAgents", "core/game", "core/season", "lib/jquery"], function (dao, db, g, ui, freeAgents, game, season, $) {
    "use strict";

    function play(amount) {
        var numDays;

        if (['day', 'week', 'month', 'throughPlayoffs', "untilPreseason"].indexOf(amount) >= 0) {
            if (amount === "day") {
                numDays = 1;
            } else if (amount === "week") {
                numDays = 7;
            } else if (amount === "month") {
                numDays = 30;
            } else if (amount === "throughPlayoffs") {
                numDays = 100;  // There aren't 100 days in the playoffs, so 100 will cover all the games and the sim stops when the playoffs end
            } else if (amount === "untilPreseason") {
                numDays = g.daysLeft;
            }

            if (g.phase <= g.PHASE.PLAYOFFS) {
                ui.updateStatus("Playing..."); // For quick UI updating, before game.play
                // Start playing games
                game.play(numDays, true);
            } else if (g.phase === g.PHASE.FREE_AGENCY) {
                if (numDays > g.daysLeft) {
                    numDays = g.daysLeft;
                }
                freeAgents.play(numDays, true);
            }
        } else if (amount === "untilPlayoffs") {
            if (g.phase < g.PHASE.PLAYOFFS) {
                ui.updateStatus("Playing..."); // For quick UI updating, before game.play
                season.getDaysLeftSchedule().then(function (numDays) {
                    game.play(numDays, true);
                });
            }
        } else if (amount === "stop") {
            db.setGameAttributes({stopGames: true}, function () {
                if (g.phase !== g.PHASE.FREE_AGENCY) {
                    // This is needed because we can't be sure if core.game.play will be called again
                    ui.updateStatus("Idle");
                }
                dao.gameAttributes.set({gamesInProgress: false}).then(ui.updatePlayMenu);
            });
        } else if (amount === "untilDraft") {
            if (g.phase === g.PHASE.BEFORE_DRAFT) {
                season.newPhase(g.PHASE.DRAFT);
            }
        } else if (amount === "untilResignPlayers") {
            if (g.phase === g.PHASE.AFTER_DRAFT) {
                season.newPhase(g.PHASE.RESIGN_PLAYERS);
            }
        } else if (amount === "untilFreeAgency") {
            if (g.phase === g.PHASE.RESIGN_PLAYERS) {
                g.dbl.transaction("negotiations").objectStore("negotiations").count().onsuccess = function (event) {
                    var numRemaining;

                    numRemaining = event.target.result;

                    // Show warning dialog only if there are players remaining un-re-signed
                    if (numRemaining === 0 || window.confirm("Are you sure you want to proceed to free agency while " + numRemaining + " of your players remain unsigned? If you do not re-sign them before free agency begins, they will be free to sign with any team, and you won't be able to go over the salary cap to sign them.")) {
                        season.newPhase(g.PHASE.FREE_AGENCY, function () {
                            ui.updateStatus(g.daysLeft + " days left");
                        });
                    }
                };
            }
        } else if (amount === "untilRegularSeason") {
            if (g.phase === g.PHASE.PRESEASON) {
                season.newPhase(g.PHASE.REGULAR_SEASON);
            }
        }

        // Close the menu
        $("#play-menu .dropdown-toggle").dropdown("toggle");
    }

    return {
        play: play
    };
});