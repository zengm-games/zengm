/**
 * @name core.trade
 * @namespace Trades between the user's team and other teams.
 */
define(["db", "globals", "core/player", "core/team", "lib/underscore", "util/helpers"], function (db, g, player, team, _, helpers) {
    "use strict";

    /**
     * Start a new trade with a team.
     * 
     * One of tid or pid can be set. If both are set, then tid is ignored. If neither are set, a tid of 0 is used.
     * 
     * @memberOf core.trade
     * @param {?number} tid An integer representing the team ID of the team the user wants to trade with, or null if pid is set.
     * @param {?number} pid An integer representing the ID of a player to be automatically added to the trade, or null if no player should be added immediately. If not null, a trade will be initiated with that player's team, regardless of what tid is set to.
     * @param {function()} cb Callback function.
     */
    function create(tid, pid, cb) {
        var cbStartTrade, otherPids;

        // Convert pid to tid;
        if (pid === undefined || pid === null) {
            pid = null;
            otherPids = [];
        } else {
            pid = Math.floor(pid);
            otherPids = [pid];
        }

        cbStartTrade = function (tid) {
            var tx;

            tx = g.dbl.transaction("trade", "readwrite");

            tx.objectStore("trade").openCursor(0).onsuccess = function (event) { // Same key always, as there is only one trade allowed at a time
                var cursor, tr;

                cursor = event.target.result;
                tr = cursor.value;
                tr.otherTid = tid;
                tr.otherPids = otherPids;
                cursor.update(tr);
            };

            tx.oncomplete = function () {
                db.setGameAttributes({lastDbChange: Date.now()}, function () {
                    cb();
                });
            };
        };

        // Make sure tid is set and corresponds to pid, if set
        if (tid === undefined || tid === null || otherPids.length > 0) {
            g.dbl.transaction("players").objectStore("players").get(pid).onsuccess = function (event) {
                var p;

                p = event.target.result;
                cbStartTrade(p.tid);
            };
        } else {
            cbStartTrade(Math.floor(tid));
        }
    }

    /**
     * Gets the team ID for the team that the user is trading with.
     * 
     * @memberOf core.trade
     * @param {function(number)} cb Callback function. The argument is the other team's tid.
     */
    function getOtherTid(cb) {
        g.dbl.transaction("trade").objectStore("trade").get(0).onsuccess = function (event) {
            var tr;

            tr = event.target.result;
            cb(tr.otherTid);
        };
    }

    /**
     * Validates that players are allowed to be traded and updates the database.
     * 
     * If any of the player IDs submitted do not correspond with the two teams that are trading, they will be ignored.
     * 
     * @memberOf core.trade
     * @param {Array.<number>} userPids An array of player ID's representing the players on the user's team in the trade.
     * @param {Array.<number>} otherPids An array of player ID's representing the players on the other team in the trade.
     * @param {function(Array.<number>, Array.<number>)} cb Callback function. Arguments are the same as the inputs, but with invalid entries removed.
     */
    function updatePlayers(userPids, otherPids, userDpids, otherDpids, cb) {
        getOtherTid(function (otherTid) {
            var playerStore;

            playerStore = g.dbl.transaction("players").objectStore("players");

            team.valueChange(otherTid, userPids, otherPids, function (dv) {
                console.log(dv / Math.abs(dv) * Math.log(Math.abs(dv)));
            });

            playerStore.index("tid").getAll(g.userTid).onsuccess = function (event) {
                var i, j, players, userPidsGood;

                userPidsGood = [];
                players = event.target.result;
                for (i = 0; i < players.length; i++) {
                    for (j = 0; j < userPids.length; j++) {
                        if (players[i].pid === userPids[j]) {
                            userPidsGood.push(userPids[j]);
                            break;
                        }
                    }
                }
                userPids = userPidsGood;
                playerStore.index("tid").getAll(otherTid).onsuccess = function (event) {
                    var draftPickStore, i, j, players, otherPidsGood;

                    otherPidsGood = [];
                    players = event.target.result;
                    for (i = 0; i < players.length; i++) {
                        for (j = 0; j < otherPids.length; j++) {
                            if (players[i].pid === otherPids[j]) {
                                otherPidsGood.push(otherPids[j]);
                                break;
                            }
                        }
                    }
                    otherPids = otherPidsGood;

                    draftPickStore = g.dbl.transaction("draftPicks").objectStore("draftPicks");
                    draftPickStore.index("tid").getAll(g.userTid).onsuccess = function (event) {
                        var i, j, picks, userDpidsGood;

                        userDpidsGood = [];
                        picks = event.target.result;
                        for (i = 0; i < picks.length; i++) {
                            for (j = 0; j < userDpids.length; j++) {
                                if (picks[i].dpid === userDpids[j]) {
                                    userDpidsGood.push(userDpids[j]);
                                    break;
                                }
                            }
                        }
                        userDpids = userDpidsGood;

                        draftPickStore.index("tid").getAll(otherTid).onsuccess = function (event) {
                            var i, j, picks, otherDpidsGood, tx, updated;

                            updated = false; // Has the trade actually changed?

                            otherDpidsGood = [];
                            picks = event.target.result;
                            for (i = 0; i < picks.length; i++) {
                                for (j = 0; j < otherDpids.length; j++) {
                                    if (picks[i].dpid === otherDpids[j]) {
                                        otherDpidsGood.push(otherDpids[j]);
                                        break;
                                    }
                                }
                            }
                            otherDpids = otherDpidsGood;

                            tx = g.dbl.transaction("trade", "readwrite");
                            tx.objectStore("trade").openCursor(0).onsuccess = function (event) {
                                var cursor, tr;

                                cursor = event.target.result;
                                tr = cursor.value;

                                if (userPids.toString() !== tr.userPids.toString()) {
                                    tr.userPids = userPids;
                                    updated = true;
                                }
                                if (otherPids.toString() !== tr.otherPids.toString()) {
                                    tr.otherPids = otherPids;
                                    updated = true;
                                }
                                if (userDpids.toString() !== tr.userDpids.toString()) {
                                    tr.userDpids = userDpids;
                                    updated = true;
                                }
                                if (otherDpids.toString() !== tr.otherDpids.toString()) {
                                    tr.otherDpids = otherDpids;
                                    updated = true;
                                }

                                if (updated) {
                                    cursor.update(tr);
                                }
                            };
                            tx.oncomplete = function () {
                                if (updated) {
                                    db.setGameAttributes({lastDbChange: Date.now()}, function () {
                                        cb(userPids, otherPids, userDpids, otherDpids);
                                    });
                                } else {
                                    cb(userPids, otherPids, userDpids, otherDpids);
                                }
                            };
                        };
                    };
                };
            };
        });
    }

    /**
     * Get the arrays containing the player IDs in the trade for both teams.
     * 
     * @memberOf core.trade
     * @param {function(Array.<number>, Array.<number>)} cb Callback function. Arguments are arrays containing the player IDs for the user's team and the other team, respectively.
     */
    function getPlayers(cb) {
        g.dbl.transaction("trade").objectStore("trade").get(0).onsuccess = function (event) {
            var tr;

            tr = event.target.result;
            cb(tr.userPids, tr.otherPids, tr.userDpids, tr.otherDpids);
        };
    }


    /**
     * Create a summary of the trade, for eventual display to the user.
     * 
     * @memberOf core.trade
     * @param {number} otherTid Team ID for the team that the user is trading with.
     * @param {Array.<number>} userPids An array of player ID's representing the players on the user's team in the trade.
     * @param {Array.<number>} otherPids An array of player ID's representing the players on the other team in the trade.
     * @param {function(Object)} cb Callback function. The argument is an object containing the trade summary.
     */
    function summary(otherTid, userPids, otherPids, userDpids, otherDpids, cb) {
        var i, done, dpids, pids, players, s, tids, transaction;

        tids = [g.userTid, otherTid];
        pids = [userPids, otherPids];
        dpids = [userDpids, otherDpids];

        s = {teams: [], warning: null};
        for (i = 0; i < 2; i++) {
            s.teams.push({trade: [], total: 0, payrollAfterTrade: 0, name: ""});
        }

        transaction = g.dbl.transaction(["draftPicks", "players", "releasedPlayers"]);

        // Calculate properties of the trade
        done = 0;
        players = [[], []];
        for (i = 0; i < 2; i++) {
            (function (i) {
                transaction.objectStore("players").index("tid").getAll(tids[i]).onsuccess = function (event) {
                    players[i] = player.filter(event.target.result, {
                        attrs: ["pid", "name", "contract"],
                        season: g.season,
                        tid: tids[i],
                        showRookies: true
                    });
                    s.teams[i].trade = _.filter(players[i], function (player) { return pids[i].indexOf(player.pid) >= 0; });
                    s.teams[i].total = _.reduce(s.teams[i].trade, function (memo, player) { return memo + player.contract.amount; }, 0);

                    transaction.objectStore("draftPicks").index("tid").getAll(tids[i]).onsuccess = function (event) {
                        var j, k, overCap, overRosterLimit, picks, ratios, teams;

                        picks = event.target.result;
                        s.teams[i].picks = [];
                        for (j = 0; j < picks.length; j++) {
                            if (dpids[i].indexOf(picks[j].dpid) >= 0) {
                                s.teams[i].picks.push({desc: picks[j].season + " " + (picks[j].round === 1 ? "1st" : "2nd") + " round pick (" + picks[j].originalAbbrev + ")"});
                            }
                        }

                        done += 1;
                        if (done === 2) {
                            done = 0;

                            teams = helpers.getTeams();

                            // Test if any warnings need to be displayed
                            overCap = [false, false];
                            overRosterLimit = [false, false];
                            ratios = [0, 0];
                            for (j = 0; j < 2; j++) {
                                if (j === 0) {
                                    k = 1;
                                } else if (j === 1) {
                                    k = 0;
                                }

                                s.teams[j].name = teams[tids[j]].region + " " + teams[tids[j]].name;

                                if (players[j].length - pids[j].length + pids[k].length > 15) {
                                    overRosterLimit[j] = true;
                                }

                                if (s.teams[j].total > 0) {
                                    ratios[j] = Math.floor((100 * s.teams[k].total) / s.teams[j].total);
                                } else if (s.teams[k].total > 0) {
                                    ratios[j] = Infinity;
                                } else {
                                    ratios[j] = 100;
                                }

                                (function (j) {
                                    db.getPayroll(transaction, tids[j], function (payroll) {
                                        var k;

                                        if (j === 0) {
                                            k = 1;
                                        } else if (j === 1) {
                                            k = 0;
                                        }

                                        s.teams[j].payrollAfterTrade = payroll / 1000 + s.teams[k].total - s.teams[j].total;
                                        if (s.teams[j].payrollAfterTrade > g.salaryCap / 1000) {
                                            overCap[j] = true;
                                        }

                                        done += 1;
                                        if (done === 2) {
                                            if (overRosterLimit.indexOf(true) >= 0) {
                                                // Which team is at fault?;
                                                if (overRosterLimit[0] === true) {
                                                    j = 0;
                                                } else {
                                                    j = 1;
                                                }
                                                s.warning = "This trade would put the " + s.teams[j].name + " over the maximum roster size limit of 15 players.";
                                            } else if ((ratios[0] > 125 && overCap[0] === true) || (ratios[1] > 125 && overCap[1] === true)) {
                                                // Which team is at fault?;
                                                if (ratios[0] > 125) {
                                                    j = 0;
                                                } else {
                                                    j = 1;
                                                }
                                                s.warning = "The " + s.teams[j].name + " are over the salary cap, so the players it receives must have a combined salary of less than 125% of the salaries of the players it trades away.  Currently, that value is " + ratios[j] + "%.";
                                            }

                                            cb(s);
                                        }
                                    });
                                }(j));
                            }
                        }
                    };
                };
            }(i));
        }
    }


    /**
     * Remove all players currently added to the trade.
     * 
     * @memberOf core.trade
     * @param {function()} cb Callback function.
     */
    function clear(cb) {
        var tx;

        tx = g.dbl.transaction("trade", "readwrite");
        tx.objectStore("trade").openCursor(0).onsuccess = function (event) {
            var cursor, tr;

            cursor = event.target.result;
            tr = cursor.value;
            tr.userPids = [];
            tr.otherPids = [];
            tr.userDpids = [];
            tr.otherDpids = [];
            cursor.update(tr);
        };
        tx.oncomplete = function () {
            db.setGameAttributes({lastDbChange: Date.now()}, function () {
                cb();
            });
        };
    }

    /**
     * Proposes the current trade in the database.
     * 
     * Before proposing the trade, the trade is validated to ensure that all player IDs match up with team IDs.
     * 
     * @memberOf core.trade
     * @param {function(boolean, string)} cb Callback function. The first argument is a boolean for whether the trade was accepted or not. The second argumetn is a string containing a message to be dispalyed to the user.
     */
    function propose(cb) {
        if (g.phase >= g.PHASE.AFTER_TRADE_DEADLINE && g.phase <= g.PHASE.PLAYOFFS) {
            cb(false, "Error! You're not allowed to make trades now.");
            return;
        }

        getPlayers(function (userPids, otherPids, userDpids, otherDpids) {
            getOtherTid(function (otherTid) {
                var dpids, pids, tids;

                tids = [g.userTid, otherTid];
                pids = [userPids, otherPids];
                dpids = [userDpids, otherDpids];

                // The summary will return a warning if (there is a problem. In that case,
                // that warning will already be pushed to the user so there is no need to
                // return a redundant message here.
                summary(otherTid, userPids, otherPids, userDpids, otherDpids, function (s) {
                    var i, outcome;

                    if (s.warning) {
                        cb(false, null);
                        return;
                    }

                    outcome = "rejected"; // Default

                    team.valueChange(otherTid, userPids, otherPids, function (dv) {
                        var draftPickStore, j, playerStore, teams, tx;

                        tx = g.dbl.transaction(["draftPicks", "players"], "readwrite");
                        draftPickStore = tx.objectStore("draftPicks");
                        playerStore = tx.objectStore("players");

                        teams = helpers.getTeams();

                        if (dv > 0) {
                            // Trade players
                            outcome = "accepted";
                            for (j = 0; j < 2; j++) {
                                (function (j) {
                                    var k, l;

                                    if (j === 0) {
                                        k = 1;
                                    } else if (j === 1) {
                                        k = 0;
                                    }

                                    for (l = 0; l < pids[j].length; l++) {
                                        (function (l) {
                                            playerStore.openCursor(pids[j][l]).onsuccess = function (event) {
                                                var cursor, p;

                                                cursor = event.target.result;
                                                p = cursor.value;
                                                p.tid = tids[k];
                                                if (g.phase <= g.PHASE.PLAYOFFS) {
                                                    p = player.addStatsRow(p);
                                                }
                                                cursor.update(p);
                                            };
                                        }(l));
                                    }

                                    for (l = 0; l < dpids[j].length; l++) {
                                        (function (l) {
                                            draftPickStore.openCursor(dpids[j][l]).onsuccess = function (event) {
                                                var cursor, dp;

                                                cursor = event.target.result;
                                                dp = cursor.value;
                                                dp.tid = tids[k];
                                                dp.abbrev = teams[tids[k]].abbrev;
                                                cursor.update(dp);
                                            };
                                        }(l));
                                    }
                                }(j));
                            }
                        }

                        tx.oncomplete = function () {
                            if (outcome === "accepted") {
                                // Auto-sort CPU team roster
                                team.rosterAutoSort(null, tids[1], function () {
                                    clear(function () { // This includes dbChange
                                        cb(true, 'Trade accepted! "Nice doing business with you!"');
                                    });
                                });
                            } else {
                                cb(false, 'Trade rejected! "What, are you crazy?"');
                            }
                        };
                    });
                });
            });
        });
    }

    return {
        create: create,
        getOtherTid: getOtherTid,
        updatePlayers: updatePlayers,
        getPlayers: getPlayers,
        summary: summary,
        clear: clear,
        propose: propose
    };
});