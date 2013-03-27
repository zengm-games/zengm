/**
 * @name api
 * @namespace Functions called directly in response to user action (clicking a button, etc).
 */
define(["db", "globals", "views", "ui", "core/draft", "core/finances", "core/game", "core/player", "core/season", "core/team", "core/trade", "lib/davis", "lib/handlebars.runtime", "lib/jquery", "lib/underscore", "util/lock"], function (db, g, views, ui, draft, finances, game, player, season, team, trade, Davis, Handlebars, $, _, lock) {
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
                    draft.generatePlayers(function () {
                        draft.setOrder(function () {
                            Davis.location.assign(new Davis.Request("/l/" + g.lid + "/draft"));
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
        $("#play-menu-stop").click(function () {
            play("stop");
            return false;
        });
        $("#play-menu-day").click(function () {
            play("day");
            return false;
        });
        $("#play-menu-week").click(function () {
            play("week");
            return false;
        });
        $("#play-menu-month").click(function () {
            play("month");
            return false;
        });
        $("#play-menu-until-playoffs").click(function () {
            play("untilPlayoffs");
            return false;
        });
        $("#play-menu-through-playoffs").click(function () {
            play("throughPlayoffs");
            return false;
        });
        $("#play-menu-until-draft").click(function () {
            play("untilDraft");
            return false;
        });
        $("#play-menu-until-resign-players").click(function () {
            play("untilResignPlayers");
            return false;
        });
        $("#play-menu-until-free-agency").click(function () {
            play("untilFreeAgency");
            return false;
        });
        $("#play-menu-until-preseason").click(function () {
            play("untilPreseason");
            return false;
        });
        $("#play-menu-until-regular-season").click(function () {
            play("untilRegularSeason");
            return false;
        });
    }

    function rosterAutoSort(cb) {
        team.rosterAutoSort(null, g.userTid, function () {
            db.setGameAttributes({lastDbChange: Date.now()}, function () {
                Davis.location.replace(new Davis.Request("/l/" + g.lid + "/roster"));
            });
        });
    }

    function rosterReorder(sortedPids, cb) {
        var tx;

        tx = g.dbl.transaction("players", "readwrite");

        // Update rosterOrder
        tx.objectStore("players").index("tid").openCursor(g.userTid).onsuccess = function (event) {
            var cursor, i, p;

            cursor = event.target.result;
            if (cursor) {
                p = cursor.value;
                for (i = 0; i < sortedPids.length; i++) {
                    if (sortedPids[i] === p.pid) {
                        p.rosterOrder = i;
                        break;
                    }
                }
                cursor.update(p);
                cursor.continue();
            }
        };

        tx.oncomplete = function () {
            db.setGameAttributes({lastDbChange: Date.now()}, function () {
                cb();
            });
        };
    }

    function rosterRelease(pid, cb) {
        var playerStore, transaction;

        transaction = g.dbl.transaction(["players", "releasedPlayers", "teams"], "readwrite");
        playerStore = transaction.objectStore("players");

        playerStore.index("tid").count(g.userTid).onsuccess = function (event) {
            var numPlayersOnRoster;

            numPlayersOnRoster = event.target.result;

            if (numPlayersOnRoster <= 5) {
                return cb("You must keep at least 5 players on your roster.");
            }

            pid = parseInt(pid, 10);
            playerStore.get(pid).onsuccess = function (event) {
                var p;

                p = event.target.result;
                // Don't let the user update CPU-controlled rosters
                if (p.tid === g.userTid) {
                    player.release(transaction, p, function () {
                        db.setGameAttributes({lastDbChange: Date.now()}, function () {
                            cb();
                        });
                    });
                } else {
                    return cb("You aren't allowed to do this.");
                }
            };
        };
    }

    function rosterBuyOut(pid, cb) {
        var playerStore, transaction;

        transaction = g.dbl.transaction(["players", "schedule", "teams"], "readwrite");
        playerStore = transaction.objectStore("players");

        playerStore.index("tid").count(g.userTid).onsuccess = function (event) {
            var numPlayersOnRoster;

            numPlayersOnRoster = event.target.result;

            if (numPlayersOnRoster <= 5) {
                return cb("You must keep at least 5 players on your roster.");
            }

            pid = parseInt(pid, 10);
            playerStore.get(pid).onsuccess = function (event) {
                var p;

                p = event.target.result;
                // Don't let the user update CPU-controlled rosters
                if (p.tid === g.userTid) {
                    transaction.objectStore("schedule").getAll().onsuccess = function (event) {
                        var cashOwed, i, numGamesRemaining, schedule;

                        // numGamesRemaining doesn't need to be calculated except for g.userTid, but it is.
                        schedule = event.target.result;
                        numGamesRemaining = 0;
                        for (i = 0; i < schedule.length; i++) {
                            if (g.userTid === schedule[i].homeTid || g.userTid === schedule[i].awayTid) {
                                numGamesRemaining += 1;
                            }
                        }

                        cashOwed = ((1 + p.contract.exp - g.season) * p.contract.amount - (1 - numGamesRemaining / 82) * p.contract.amount);  // [thousands of dollars]

                        transaction.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                            var cash, cursor, s, t;

                            cursor = event.target.result;
                            t = cursor.value;

                            s = t.seasons.length - 1;
                            cash = t.seasons[s].cash;  // [thousands of dollars]

                            if (cashOwed < cash) {
                                // Pay the cash
                                t.seasons[s].cash -= cashOwed;
                                t.seasons[s].expenses.buyOuts.amount += cashOwed;
                                cursor.update(t);

                                finances.updateRanks(transaction, "expenses", function () {
                                    // Set to FA in database
                                    player.genBaseMoods(transaction, function (baseMoods) {
                                        player.addToFreeAgents(transaction, p, null, baseMoods, function () {
                                            db.setGameAttributes({lastDbChange: Date.now()}, function () {
                                                cb();
                                            });
                                        });
                                    });
                                });
                            } else {
                                return cb("Not enough cash.");
                            }
                        };
                    };
                } else {
                    return cb("You aren't allowed to do this.");
                }
            };
        };
    }

    function tradeUpdate(userPids, otherPids, cb) {
        trade.updatePlayers(userPids, otherPids, function (userPids, otherPids) {
            trade.getOtherTid(function (otherTid) {
                trade.summary(otherTid, userPids, otherPids, function (summary) {
                    var tradeSummary;
                    tradeSummary = Handlebars.templates.tradeSummary({lid: g.lid, summary: summary});
                    cb(tradeSummary, userPids, otherPids);
                });
            });
        });
    }

    function draftUntilUserOrEnd(cb2) {
        ui.updateStatus('Draft in progress...');
        var pids = draft.untilUserOrEnd(function (pids) {
            var done = false;
            if (g.phase === g.PHASE.AFTER_DRAFT) {
                done = true;
                ui.updateStatus('Idle');
            }
            cb2(pids, done);
        });
    }

    function draftUser(pid, cb) {
        var transaction;

        pid = parseInt(pid, 10);

        db.getDraftOrder(function (draftOrder) {
            var pick, playerStore;

            pick = draftOrder.shift();
            if (pick.tid === g.userTid) {
                draft.selectPlayer(pick, pid, function (pid) {
                    db.setDraftOrder(draftOrder, function () {
                        cb(pid);
                    });
                });
            } else {
                console.log("ERROR: User trying to draft out of turn.");
            }
        });
    }

    function moveToNewWindow() {
        ui.moveToNewWindow();
    }

    return {
        play: play,
        playMenuHandlers: playMenuHandlers,
        rosterAutoSort: rosterAutoSort,
        rosterReorder: rosterReorder,
        rosterRelease: rosterRelease,
        rosterBuyOut: rosterBuyOut,
        tradeUpdate: tradeUpdate,
        draftUntilUserOrEnd: draftUntilUserOrEnd,
        draftUser: draftUser,
        moveToNewWindow: moveToNewWindow
    };
});