/**
 * @name api
 * @namespace Functions called directly in response to user action (clicking a button, etc).
 */
define(["db", "views", "ui", "core/draft", "core/game", "core/player", "core/season", "core/trade", "util/lock"], function (db, views, ui, draft, game, player, season, trade, lock) {
    "use strict";

    function play(amount) {
        var numDays;

        if (['day', 'week', 'month', 'through_playoffs'].indexOf(amount) >= 0) {
            // Start playing games
            if (amount === "day") {
                numDays = 1;
            } else if (amount === "week") {
                numDays = 7;
            } else if (amount === "month") {
                numDays = 30;
            } else if (amount === "through_playoffs") {
                numDays = 100;  // There aren't 100 days in the playoffs, so 100 will cover all the games and the sim stops when the playoffs end
            }

            game.play(numDays, true);
        } else if (amount === "until_playoffs") {
            if (g.phase < c.PHASE_PLAYOFFS) {
/*                season.getSchedule(null, 0, function (schedule) {
                    numDays = Math.floor(2 * schedule.length / (g.numTeams));
                    game.play(numDays, true);
                });*/
                game.play(500, true);
            }
        } else if (amount === "stop") {
            db.setGameAttributes({stopGames: true}, function () {
                // This is needed because we can't be sure if core.game.play will be called again
                ui.updateStatus('Idle');
                lock.setGamesInProgress(false, ui.updatePlayMenu);
            });
        } else if (amount === "until_draft") {
            if (g.phase === c.PHASE_BEFORE_DRAFT) {
                season.newPhase(c.PHASE_DRAFT, function () {
                    draft.generatePlayers(function () {
                        draft.setOrder(function () {
                            Davis.location.assign(new Davis.Request("/l/" + g.lid + "/draft"));
                        });
                    });
                });
            }
        } else if (amount === "until_resign_players") {
            if (g.phase === c.PHASE_AFTER_DRAFT) {
                season.newPhase(c.PHASE_RESIGN_PLAYERS);
            }
        } else if (amount === "until_free_agency") {
            if (g.phase === c.PHASE_RESIGN_PLAYERS) {
                season.newPhase(c.PHASE_FREE_AGENCY, function () {
                    ui.updateStatus("Idle");
                });
            }
        } else if (amount === "until_preseason") {
            if (g.phase === c.PHASE_FREE_AGENCY) {
                season.newPhase(c.PHASE_PRESEASON);
            }
        } else if (amount === "until_regular_season") {
            if (g.phase === c.PHASE_PRESEASON) {
                season.newPhase(c.PHASE_REGULAR_SEASON);
            }
        }
    }

    function rosterAutoSort(cb) {
        db.rosterAutoSort(null, g.userTid, function () {
            Davis.location.replace(new Davis.Request("/l/" + g.lid + "/roster"));
        });
    }

    function rosterReorder(sortedPids, cb) {
        // Update rosterOrder
        g.dbl.transaction("players", "readwrite").objectStore("players").index("tid").openCursor(g.userTid).onsuccess = function (event) {
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
            } else {
                cb();
            }
        };
    }

    function rosterRelease(pid, cb) {
        var playerStore, transaction;

        transaction = g.dbl.transaction(["players", "releasedPlayers"], "readwrite");
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

                        cashOwed = 1000 * ((1 + p.contractExp - g.season) * p.contractAmount - (1 - numGamesRemaining / 82) * p.contractAmount);

                        transaction.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                            var cash, cursor, t;

                            cursor = event.target.result;
                            t = cursor.value;
                            cash = _.last(t.seasons).cash;
                            if (cashOwed < cash) {
                                // Pay the cash
                                _.last(t.seasons).cash -= cashOwed;
                                cursor.update(t);

                                // Set to FA in database
                                player.addToFreeAgents(transaction, p, null, function () {
                                    db.setGameAttributes({lastDbChange: Date.now()}, function () {
                                        cb();
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
            if (g.phase === c.PHASE_AFTER_DRAFT) {
                done = true;
                ui.updateStatus('Idle');
            }
            cb2(pids, done);
        });
    }

    function draftUser(pid, cb) {
        var transaction;

        pid = parseInt(pid, 10);

        transaction = g.dbl.transaction(["draftOrder", "players"], "readwrite");
        db.getDraftOrder(transaction, function (draftOrder) {
            var pick, playerStore;

            pick = draftOrder.shift();
            if (pick.tid === g.userTid) {
                playerStore = transaction.objectStore("players");
                draft.selectPlayer(pick, pid, playerStore, function (pid) {
                    db.setDraftOrder(transaction, draftOrder, function () {
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