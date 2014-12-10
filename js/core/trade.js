/**
 * @name core.trade
 * @namespace Trades between the user's team and other teams.
 */
define(["dao", "db", "globals", "core/player", "core/team", "lib/underscore"], function (dao, db, g, player, team, _) {
    "use strict";

    /**
     * Start a new trade with a team.
     * 
     * @memberOf core.trade
     * @param {Array.<Object>} teams Array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs). If the other team's tid is null, it will automatically be determined from the pids.
     * @param {function()} cb Callback function.
     */
    function create(teams, cb) {
        g.dbl.transaction("trade").objectStore("trade").get(0).onsuccess = function (event) { // Same key always, as there is only one trade allowed at a time
            var cbStartTrade, oldTr;

            oldTr = event.target.result;

            // If nothing is in this trade, it's just a team switch, so keep the old stuff from the user's team
            if (teams[0].pids.length === 0 && teams[1].pids.length === 0 && teams[0].dpids.length === 0 && teams[1].dpids.length === 0) {
                teams[0].pids = oldTr.teams[0].pids;
                teams[0].dpids = oldTr.teams[0].dpids;
            }

            cbStartTrade = function () {
                var tx;

                tx = g.dbl.transaction("trade", "readwrite");
                tx.objectStore("trade").put({
                    rid: 0,
                    teams: teams
                });
                tx.oncomplete = function () {
                    db.setGameAttributes({lastDbChange: Date.now()}, function () {
                        cb();
                    });
                };
            };

            // Make sure tid is set
            if (teams[1].tid === undefined || teams[1].tid === null) {
                g.dbl.transaction("players").objectStore("players").get(teams[1].pids[0]).onsuccess = function (event) {
                    var p;

                    p = event.target.result;
                    teams[1].tid = p.tid;
                    cbStartTrade();
                };
            } else {
                cbStartTrade();
            }
        };
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
            cb(tr.teams[1].tid);
        };
    }

    /**
     * Validates that players are allowed to be traded and updates the database.
     * 
     * If any of the player IDs submitted do not correspond with the two teams that are trading, they will be ignored.
     * 
     * @memberOf core.trade
     * @param {Array.<Object>} teams Array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs).
     * @param {function(Array.<Object>)} cb Callback function. Arguments are the same as the inputs, but with invalid entries removed.
     */
    function updatePlayers(teams, cb) {
        var afterCheck, i, tx;

        tx = g.dbl.transaction(["draftPicks", "players"]);

        // This is just for debugging
        team.valueChange(teams[1].tid, teams[0].pids, teams[1].pids, teams[0].dpids, teams[1].dpids, null, function (dv) {
            console.log(dv);
        });

        // This will get called after all the pids and dpids are checked to make sure they are accurate
        afterCheck = _.after(teams.length * 2, function () {
            var tx, updated;

            updated = false; // Has the trade actually changed?

            tx = g.dbl.transaction("trade", "readwrite");
            tx.objectStore("trade").openCursor(0).onsuccess = function (event) {
                var cursor, i, tr;

                cursor = event.target.result;
                tr = cursor.value;

                for (i = 0; i < 2; i++) {
                    if (teams[i].tid !== tr.teams[i].tid) {
                        updated = true;
                    }
                    if (teams[i].pids.toString() !== tr.teams[i].pids.toString()) {
                        updated = true;
                    }
                    if (teams[i].dpids.toString() !== tr.teams[i].dpids.toString()) {
                        updated = true;
                    }
                }

                if (updated) {
                    tr.teams = teams;
                    cursor.update(tr);
                }
            };
            tx.oncomplete = function () {
                if (updated) {
                    db.setGameAttributes({lastDbChange: Date.now()}, function () {
                        cb(teams);
                    });
                } else {
                    cb(teams);
                }
            };
        });

        // Make sure each entry in teams has pids and dpids that actually correspond to the correct tid
        for (i = 0; i < teams.length; i++) {
            (function (i) {
                // Check players
                tx.objectStore("players").index("tid").getAll(teams[i].tid).onsuccess = function (event) {
                    var j, pidsGood, players;

                    pidsGood = [];
                    players = event.target.result;
                    for (j = 0; j < players.length; j++) {
                        // Also, make sure player is not untradable
                        if (teams[i].pids.indexOf(players[j].pid) >= 0 && !isUntradable(players[j])) {
                            pidsGood.push(players[j].pid);
                        }
                    }
                    teams[i].pids = pidsGood;

                    afterCheck();
                };

                // Check draft picks
                tx.objectStore("draftPicks").index("tid").getAll(teams[i].tid).onsuccess = function (event) {
                    var dps, dpidsGood, j;

                    dpidsGood = [];
                    dps = event.target.result;
                    for (j = 0; j < dps.length; j++) {
                        if (teams[i].dpids.indexOf(dps[j].dpid) >= 0) {
                            dpidsGood.push(dps[j].dpid);
                        }
                    }
                    teams[i].dpids = dpidsGood;

                    afterCheck();
                };
            }(i));
        }
    }

    /**
     * Get the contents of the current trade from the database.
     * 
     * @memberOf core.trade
     * @param {function(Array.<Object>)} cb Callback function. Argument is an array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs).
     */
    function get(cb) {
        g.dbl.transaction("trade").objectStore("trade").get(0).onsuccess = function (event) {
            var tr;

            tr = event.target.result;
            cb(tr.teams);
        };
    }


    /**
     * Create a summary of the trade, for eventual display to the user.
     * 
     * @memberOf core.trade
     * @param {Array.<Object>} teams Array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs).
     * @param {function(Object)} cb Callback function. The argument is an object containing the trade summary.
     */
    function summary(teams, cb) {
        var i, done, dpids, pids, players, s, tids, transaction;

        tids = [teams[0].tid, teams[1].tid];
        pids = [teams[0].pids, teams[1].pids];
        dpids = [teams[0].dpids, teams[1].dpids];

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
                dao.players.getAll({
                    ot: transaction,
                    index: "tid",
                    key: tids[i]
                }, function (playersTemp) {
                    players[i] = player.filter(playersTemp, {
                        attrs: ["pid", "name", "contract"],
                        season: g.season,
                        tid: tids[i],
                        showRookies: true
                    });
                    s.teams[i].trade = _.filter(players[i], function (player) { return pids[i].indexOf(player.pid) >= 0; });
                    s.teams[i].total = _.reduce(s.teams[i].trade, function (memo, player) { return memo + player.contract.amount; }, 0);

                    transaction.objectStore("draftPicks").index("tid").getAll(tids[i]).onsuccess = function (event) {
                        var j, k, overCap, picks, ratios;

                        picks = event.target.result;
                        s.teams[i].picks = [];
                        for (j = 0; j < picks.length; j++) {
                            if (dpids[i].indexOf(picks[j].dpid) >= 0) {
                                s.teams[i].picks.push({desc: picks[j].season + " " + (picks[j].round === 1 ? "1st" : "2nd") + " round pick (" + g.teamAbbrevsCache[picks[j].originalTid] + ")"});
                            }
                        }

                        done += 1;
                        if (done === 2) {
                            done = 0;

                            // Test if any warnings need to be displayed
                            overCap = [false, false];
                            ratios = [0, 0];
                            for (j = 0; j < 2; j++) {
                                if (j === 0) {
                                    k = 1;
                                } else if (j === 1) {
                                    k = 0;
                                }

                                s.teams[j].name = g.teamRegionsCache[tids[j]] + " " + g.teamNamesCache[tids[j]];

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
                                            if ((ratios[0] > 125 && overCap[0] === true) || (ratios[1] > 125 && overCap[1] === true)) {
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
                });
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
            var cursor, i, tr;

            cursor = event.target.result;
            tr = cursor.value;
            for (i = 0; i < tr.teams.length; i++) {
                tr.teams[i].pids = [];
                tr.teams[i].dpids = [];
            }
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
     * @param {function(boolean, string)} cb Callback function. The first argument is a boolean for whether the trade was accepted or not. The second argument is a string containing a message to be dispalyed to the user.
     * @param {boolean} forceTrade When true (like in God Mode), this trade is accepted regardless of the AI
     */
    function propose(cb, forceTrade) {
        forceTrade = forceTrade !== undefined ? forceTrade : false;

        if (g.phase >= g.PHASE.AFTER_TRADE_DEADLINE && g.phase <= g.PHASE.PLAYOFFS) {
            cb(false, "Error! You're not allowed to make trades now.");
            return;
        }

        get(function (teams) {
            var dpids, pids, tids;

            tids = [teams[0].tid, teams[1].tid];
            pids = [teams[0].pids, teams[1].pids];
            dpids = [teams[0].dpids, teams[1].dpids];

            // The summary will return a warning if (there is a problem. In that case,
            // that warning will already be pushed to the user so there is no need to
            // return a redundant message here.
            summary(teams, function (s) {
                var outcome;

                if (s.warning && !forceTrade) {
                    cb(false, null);
                    return;
                }

                outcome = "rejected"; // Default

                team.valueChange(teams[1].tid, teams[0].pids, teams[1].pids, teams[0].dpids, teams[1].dpids, null, function (dv) {
                    var draftPickStore, j, playerStore, tx;

                    tx = g.dbl.transaction(["draftPicks", "players", "playerStats"], "readwrite");
                    draftPickStore = tx.objectStore("draftPicks");
                    playerStore = tx.objectStore("players");

                    if (dv > 0 || forceTrade) {
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
                                            // Don't make traded players untradable
                                            //p.gamesUntilTradable = 15;
                                            p.ptModifier = 1; // Reset
                                            if (g.phase <= g.PHASE.PLAYOFFS) {
                                                player.addStatsRow(tx, p, g.phase === g.PHASE.PLAYOFFS, function (p) {
                                                    cursor.update(p);
                                                });
                                            } else {
                                                cursor.update(p);
                                            }
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
                                            dp.abbrev = g.teamAbbrevsCache[tids[k]];
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
                            team.rosterAutoSort(null, tids[1]).then(function () {
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
    }

    /**
     * Make a trade work
     *
     * Have the AI add players/picks until they like the deal. Uses forward selection to try to find the first deal the AI likes.
     *
     * @memberOf core.trade
     * @param {Array.<Object>} teams Array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs).
     * @param {boolean} holdUserConstant If true, then players/picks will only be added from the other team. This is useful for the trading block feature.
     * @param {?Object} estValuesCached Estimated draft pick values from trade.getPickValues, or null. Only pass if you're going to call this repeatedly, then it'll be faster if you cache the values up front.
     * @param {function(string)} cb Callback function. The argument is a string containing a message to be dispalyed to the user, as if it came from the AI GM.
     */
    function makeItWork(teams, holdUserConstant, estValuesCached, cb) {
        var added, initialSign, tryAddAsset, testTrade;

        added = 0;

        // Add either the highest value asset or the lowest value one that makes the trade good for the AI team.
        tryAddAsset = function () {
            var assets, tx;

            assets = [];

            tx = g.dbl.transaction(["draftPicks", "players"]);

            if (!holdUserConstant) {
                // Get all players not in userPids
                tx.objectStore("players").index("tid").openCursor(teams[0].tid).onsuccess = function (event) {
                    var cursor, p;

                    cursor = event.target.result;
                    if (cursor) {
                        p = cursor.value;

                        if (teams[0].pids.indexOf(p.pid) < 0 && !isUntradable(p)) {
                            assets.push({
                                type: "player",
                                pid: p.pid,
                                tid: teams[0].tid
                            });
                        }

                        cursor.continue();
                    }
                };
            }

            // Get all players not in otherPids
            tx.objectStore("players").index("tid").openCursor(teams[1].tid).onsuccess = function (event) {
                var cursor, p;

                cursor = event.target.result;
                if (cursor) {
                    p = cursor.value;

                    if (teams[1].pids.indexOf(p.pid) < 0 && !isUntradable(p)) {
                        assets.push({
                            type: "player",
                            pid: p.pid,
                            tid: teams[1].tid
                        });
                    }

                    cursor.continue();
                }
            };

            if (!holdUserConstant) {
                // Get all draft picks not in userDpids
                tx.objectStore("draftPicks").index("tid").openCursor(teams[0].tid).onsuccess = function (event) {
                    var cursor, dp;

                    cursor = event.target.result;
                    if (cursor) {
                        dp = cursor.value;

                        if (teams[0].dpids.indexOf(dp.dpid) < 0) {
                            assets.push({
                                type: "draftPick",
                                dpid: dp.dpid,
                                tid: teams[0].tid
                            });
                        }

                        cursor.continue();
                    }
                };
            }

            // Get all draft picks not in otherDpids
            tx.objectStore("draftPicks").index("tid").openCursor(teams[1].tid).onsuccess = function (event) {
                var cursor, dp;

                cursor = event.target.result;
                if (cursor) {
                    dp = cursor.value;

                    if (teams[1].dpids.indexOf(dp.dpid) < 0) {
                        assets.push({
                            type: "draftPick",
                            dpid: dp.dpid,
                            tid: teams[1].tid
                        });
                    }

                    cursor.continue();
                }
            };

            tx.oncomplete = function () {
                var done, i, otherDpids, otherPids, userPids, userDpids;

                // If we've already added 5 assets or there are no more to try, stop
                if (initialSign === -1 && (assets.length === 0 || added >= 5)) {
                    cb(false);
                    return;
                }

                // Calculate the value for each asset added to the trade, for use in forward selection
                done = 0;
                for (i = 0; i < assets.length; i++) {
                    userPids = teams[0].pids.slice();
                    otherPids = teams[1].pids.slice();
                    userDpids = teams[0].dpids.slice();
                    otherDpids = teams[1].dpids.slice();

                    if (assets[i].type === "player") {
                        if (assets[i].tid === g.userTid) {
                            userPids.push(assets[i].pid);
                        } else {
                            otherPids.push(assets[i].pid);
                        }
                    } else {
                        if (assets[i].tid === g.userTid) {
                            userDpids.push(assets[i].dpid);
                        } else {
                            otherDpids.push(assets[i].dpid);
                        }
                    }
                    (function (i) {
                        team.valueChange(teams[1].tid, userPids, otherPids, userDpids, otherDpids, estValuesCached, function (dv) {
                            var asset, j;

                            assets[i].dv = dv;
                            done += 1;
                            if (done === assets.length) {
                                assets.sort(function (a, b) { return b.dv - a.dv; });

                                // Find the asset that will push the trade value the smallest amount above 0
                                for (j = 0; j < assets.length; j++) {
                                    if (assets[j].dv < 0) {
                                        break;
                                    }
                                }
                                if (j > 0) {
                                    j -= 1;
                                }
                                asset = assets[j];
                                if (asset.type === "player") {
                                    if (asset.tid === g.userTid) {
                                        teams[0].pids.push(asset.pid);
                                    } else {
                                        teams[1].pids.push(asset.pid);
                                    }
                                } else {
                                    if (asset.tid === g.userTid) {
                                        teams[0].dpids.push(asset.dpid);
                                    } else {
                                        teams[1].dpids.push(asset.dpid);
                                    }
                                }

                                added += 1;

                                testTrade();
                            }
                        });
                    }(i));
                }
            };
        };

        // See if the AI team likes the current trade. If not, try adding something to it.
        testTrade = function () {
            team.valueChange(teams[1].tid, teams[0].pids, teams[1].pids, teams[0].dpids, teams[1].dpids, estValuesCached, function (dv) {
                if (dv > 0 && initialSign === -1) {
                    cb(true, teams);
                } else if ((added > 2 || (added > 0 && Math.random() > 0.5)) && initialSign === 1) {
                    if (dv > 0) {
                        cb(true, teams);
                    } else {
                        cb(false);
                    }
                } else {
                    tryAddAsset();
                }
            });
        };

        team.valueChange(teams[1].tid, teams[0].pids, teams[1].pids, teams[0].dpids, teams[1].dpids, estValuesCached, function (dv) {
            if (dv > 0) {
                // Try to make trade better for user's team
                initialSign = 1;
            } else {
                // Try to make trade better for AI team
                initialSign = -1;
            }

            testTrade();
        });
    }

    /**
     * Make a trade work
     *
     * This should be called for a trade negotiation, as it will update the trade objectStore.
     *
     * @memberOf core.trade
     * @param {function(string)} cb Callback function. The argument is a string containing a message to be dispalyed to the user, as if it came from the AI GM.
     */
    function makeItWorkTrade(cb) {
        getPickValues(g.dbl.transaction("players"), function (estValues) {
            get(function (teams0) {
                makeItWork(teams0, false, estValues, function (found, teams) {
                    if (!found) {
                        cb(g.teamRegionsCache[teams0[1].tid] + ' GM: "I can\'t afford to give up so much."');
                    } else {
                        summary(teams, function (s) {
                            var tx;

                            // Store AI's proposed trade in database
                            tx = g.dbl.transaction("trade", "readwrite");
                            tx.objectStore("trade").openCursor(0).onsuccess = function (event) {
                                var cursor, i, updated, tr;

                                cursor = event.target.result;
                                tr = cursor.value;

                                updated = false;

                                for (i = 0; i < 2; i++) {
                                    if (teams[i].tid !== tr.teams[i].tid) {
                                        updated = true;
                                    }
                                    if (teams[i].pids.toString() !== tr.teams[i].pids.toString()) {
                                        updated = true;
                                    }
                                    if (teams[i].dpids.toString() !== tr.teams[i].dpids.toString()) {
                                        updated = true;
                                    }
                                }

                                if (updated) {
                                    tr.teams = teams;
                                    cursor.update(tr);
                                }
                            };
                            tx.oncomplete = function () {
                                if (s.warning) {
                                    cb(g.teamRegionsCache[teams[1].tid] + ' GM: "Something like this would work if you can figure out how to get it done without breaking the salary cap rules."');
                                } else {
                                    cb(g.teamRegionsCache[teams[1].tid] + ' GM: "How does this sound?"');
                                }
                            };
                        });
                    }
                });
            });
        });
    }

    /**
     * Filter untradable players.
     *
     * If a player is not tradable, set untradable flag in the root of the object.
     * 
     * @memberOf core.trade
     * @param {Array.<Object>} players Array of player objects or partial player objects
     * @return {Array.<Object>} Processed input
     */
    function filterUntradable(players) {
        var i;

        for (i = 0; i < players.length; i++) {
            if (players[i].contract.exp <= g.season && g.phase > g.PHASE.PLAYOFFS && g.phase < g.PHASE.FREE_AGENCY) {
                // If the season is over, can't trade players whose contracts are expired
                players[i].untradable = true;
                players[i].untradableMsg = "Cannot trade expired contracts";
            } else if (players[i].gamesUntilTradable > 0) {
                // Can't trade players who recently were signed or traded
                players[i].untradable = true;
                players[i].untradableMsg = "Cannot trade recently-acquired player for " + players[i].gamesUntilTradable + " more games";
            } else {
                players[i].untradable = false;
                players[i].untradableMsg = "";
            }
        }

        return players;
    }

    /**
     * Is a player untradable.
     *
     * Just calls filterUntradable and discards everything but the boolean.
     * 
     * @memberOf core.trade
     * @param {<Object>} players Player object or partial player objects
     * @return {boolean} Processed input
     */
    function isUntradable(player) {
        return filterUntradable([player])[0].untradable;
    }


    /**
     * Estimate draft pick values, based on the generated draft prospects in the database.
     *
     * This was made for team.valueChange, so it could be called once and the results cached.
     * 
     * @memberOf core.trade
     * @param {(IDBTransaction)} tx An IndexedDB transaction on players.
     * @param {function(Object)} cb Callback function that takes estimated draft pick values.
     */
    function getPickValues(tx, cb) {
        var estValues, i, withAll;

        estValues = {
            default: [75, 73, 71, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 50, 50, 49, 49, 49, 48, 48, 48, 47, 47, 47, 46, 46, 46, 45, 45, 45, 44, 44, 44, 43, 43, 43, 42, 42, 42, 41, 41, 41, 40, 40, 39, 39, 38, 38, 37, 37] // This is basically arbitrary
        };

        withAll = _.after(4, function () {
            cb(estValues);
        });

        // Look up to 4 season in the future, but depending on whether this is before or after the draft, the first or last will be empty/incomplete
        for (i = g.season; i < g.season + 4; i++) {
            tx.objectStore("players").index("draft.year").getAll(i).onsuccess = function (event) {
                var i, players;

                players = event.target.result;

                if (players.length > 0) {
                    for (i = 0; i < players.length; i++) {
                        players[i].value += 4; // +4 is to generally make picks more valued
                    }
                    players.sort(function (a, b) { return b.value - a.value; });
                    estValues[players[0].draft.year] = _.pluck(players, "value");
                }

                withAll();
            };
        }
    }

    return {
        create: create,
        updatePlayers: updatePlayers,
        get: get,
        getOtherTid: getOtherTid,
        summary: summary,
        clear: clear,
        propose: propose,
        makeItWork: makeItWork,
        makeItWorkTrade: makeItWorkTrade,
        filterUntradable: filterUntradable,
        getPickValues: getPickValues
    };
});