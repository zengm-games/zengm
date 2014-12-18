define(["globals", "lib/bluebird", "lib/jquery"], function (g, Promise, $) {
    "use strict";

    var contracts, gameAttributes, payrolls, players, schedule;

    /**
     * Create an IndexedDB transaction whose oncomplete event can be accessed as a promise.
     * 
     * This is the same as IDBRequest.transaction except the returned transaction has a "complete" property, which contains a function that returns a promise which resolves when the oncomplete event of the transaction fires.
     */
    function tx(storeNames, mode) {
        var tx;

        tx = g.dbl.transaction(storeNames, mode);

        tx.complete = function () {
            return new Promise(function (resolve, reject) {
                tx.oncomplete = function () {
                    resolve();
                };
            });
        };

        return tx;
    }

    /**
     * Get an object store or transaction based on input which may be the desired object store, a transaction to be used, or null.
     * 
     * This allows for the convenient use of transactions or object stores that have already been defined, which is often necessary.
     * 
     * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction to be used; if null is passed, then a new transaction will be used.
     * @param {(string|Array.<string>)} transactionObjectStores The object stores to open a transaction with, if necessary.
     * @param {?string} objectStore The object store to return. If null, return a transaction.
     * @param {string=} readwrite If set to "readwrite", return a readwrite transaction or object store. Otherwise, read only (default).
     * @return {(IDBObjectStore|IDBTransaction)} The requested object store or transaction.
     */
    function getObjectStore(db, ot, transactionObjectStores, objectStore, readwrite) {
        readwrite = readwrite !== undefined ? readwrite : false;

        if (ot instanceof IDBTransaction) {
            if (objectStore !== null) {
                return ot.objectStore(objectStore);
            }
            return ot; // Return original transaction
        }

        // Return a transaction
        if (objectStore === null) {
            if (ot instanceof IDBObjectStore) {
                return ot.transaction;
            }

            if (readwrite === "readwrite") {
                return db.transaction(transactionObjectStores, "readwrite");
            }
            return db.transaction(transactionObjectStores);
        }

        // ot is an objectStore already, and an objectStore was requested (not a transation)
        if (ot instanceof IDBObjectStore) {
            return ot;
        }


        if (readwrite === "readwrite") {
            return db.transaction(transactionObjectStores, "readwrite").objectStore(objectStore);
        }
        return db.transaction(transactionObjectStores).objectStore(objectStore);
    }

    function generateBasicDao(dbmOrDbl, objectStore, requestedMethods) {
        var filteredMethods, i, methods;

        methods = {};

        methods.get = function (options) {
            options = options !== undefined ? options : {};
            options.ot = options.ot !== undefined ? options.ot : null;
            options.index = options.index !== undefined ? options.index : null;
            options.key = options.key !== undefined ? options.key : null;

            return new Promise(function (resolve, reject) {
                var objectStoreOrIndex;

                objectStoreOrIndex = getObjectStore(g[dbmOrDbl], options.ot, objectStore, objectStore);

                if (options.index !== null) {
                    objectStoreOrIndex = objectStoreOrIndex.index(options.index);
                }

                objectStoreOrIndex.get(options.key).onsuccess = function (event) {
                    resolve(event.target.result);
                };
            });
        };

        methods.getAll = function (options) {
            options = options !== undefined ? options : {};
            options.ot = options.ot !== undefined ? options.ot : null;
            options.index = options.index !== undefined ? options.index : null;
            options.key = options.key !== undefined ? options.key : null;

            return new Promise(function (resolve, reject) {
                var objectStoreOrIndex;

                objectStoreOrIndex = getObjectStore(g[dbmOrDbl], options.ot, objectStore, objectStore);

                if (options.index !== null) {
                    objectStoreOrIndex = objectStoreOrIndex.index(options.index);
                }

                objectStoreOrIndex.getAll(options.key).onsuccess = function (event) {
                    resolve(event.target.result);
                };
            });
        };

        methods.add = function (options) {
            options = options !== undefined ? options : {};
            options.ot = options.ot !== undefined ? options.ot : null;
            if (options.value === undefined) { throw new Error("Must supply value property on input to \"add\" method."); }

            return new Promise(function (resolve, reject) {
                getObjectStore(g[dbmOrDbl], options.ot, objectStore, objectStore, "readwrite").add(options.value).onsuccess = function (event) {
                    resolve(event.target.result);
                };
            });
        };

        methods.put = function (options) {
            options = options !== undefined ? options : {};
            options.ot = options.ot !== undefined ? options.ot : null;
            if (options.value === undefined) { throw new Error("Must supply value property on input to \"put\" method."); }

            return new Promise(function (resolve, reject) {
                getObjectStore(g[dbmOrDbl], options.ot, objectStore, objectStore, "readwrite").put(options.value).onsuccess = function (event) {
                    resolve(event.target.result);
                };
            });
        };

        methods.count = function (options) {
            options = options !== undefined ? options : {};
            options.ot = options.ot !== undefined ? options.ot : null;
            options.index = options.index !== undefined ? options.index : null;
            options.key = options.key !== undefined ? options.key : null;

            return new Promise(function (resolve, reject) {
                var objectStoreOrIndex;

                objectStoreOrIndex = getObjectStore(g[dbmOrDbl], options.ot, objectStore, objectStore);

                if (options.index !== null) {
                    objectStoreOrIndex = objectStoreOrIndex.index(options.index);
                }

                objectStoreOrIndex.count(options.key).onsuccess = function (event) {
                    resolve(event.target.result);
                };
            });
        };

        methods.delete = function (options) {
            options = options !== undefined ? options : {};
            options.ot = options.ot !== undefined ? options.ot : null;
            options.key = options.key !== undefined ? options.key : null;

            return new Promise(function (resolve, reject) {
                getObjectStore(g[dbmOrDbl], options.ot, objectStore, objectStore, "readwrite").delete(options.key).onsuccess = function (event) {
                    resolve();
                };
            });
        };


        methods.clear = function (options) {
            options = options !== undefined ? options : {};
            options.ot = options.ot !== undefined ? options.ot : null;

            return new Promise(function (resolve, reject) {
                getObjectStore(g[dbmOrDbl], options.ot, objectStore, objectStore, "readwrite").clear().onsuccess = function (event) {
                    resolve();
                };
            });
        };

        methods.iterate = function (options) {
            options = options !== undefined ? options : {};
            options.ot = options.ot !== undefined ? options.ot : null;
            options.index = options.index !== undefined ? options.index : null;
            options.key = options.key !== undefined ? options.key : null;
            options.modify = options.modify !== undefined ? options.modify : null;

            return new Promise(function (resolve, reject) {
                var objectStoreOrIndex;

                objectStoreOrIndex = getObjectStore(g[dbmOrDbl], options.ot, objectStore, objectStore);

                if (options.index !== null) {
                    objectStoreOrIndex = objectStoreOrIndex.index(options.index);
                }

                objectStoreOrIndex.openCursor(options.key).onsuccess = function (event) {
                    var cursor;

                    cursor = event.target.result;

                    if (cursor) {
                        if (options.modify !== null) {
                            // Return a promise: waits until resolved to continue
                            // Return a value: immediately continue
                            // Return or resolve to undefined: no update (otherwise update)
                            Promise.resolve(options.modify(cursor.value)).then(function (updatedValue) {
                                // Only update if return value is not undefined
                                if (updatedValue !== undefined) {
                                    cursor.update(updatedValue);
                                }
                                cursor.continue();
                            });
                        }
                    } else {
                        resolve();
                    }
                };
            });
        };

        filteredMethods = {};

        for (i = 0; i < requestedMethods.length; i++) {
            filteredMethods[requestedMethods[i]] = methods[requestedMethods[i]];
        }

        return filteredMethods;
    }



    contracts = {};

    /**
    * Gets all the contracts a team owes.
    * 
    * This includes contracts for players who have been released but are still owed money.
    * 
    * @memberOf db
    * @param {IDBTransaction|null} options.ot An IndexedDB transaction on players and releasedPlayers; if null is passed, then a new transaction will be used.
    * @param {number} options.key Team ID.
    * @returns {Promise.Array} Array of objects containing contract information.
    */
    contracts.getAll = function (options) {
        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;
        options.key = options.key !== undefined ? options.key : null;

        return new Promise(function (resolve, reject) {
            var contracts, tx;

            tx = getObjectStore(g.dbl, options.ot, ["players", "releasedPlayers"], null);

            // First, get players currently on the roster
            tx.objectStore("players").index("tid").getAll(options.key).onsuccess = function (event) {
                var i, players;

                contracts = [];
                players = event.target.result;
                for (i = 0; i < players.length; i++) {
                    contracts.push({
                        pid: players[i].pid,
                        name: players[i].name,
                        skills: players[i].ratings[players[i].ratings.length - 1].skills,
                        injury: players[i].injury,
                        watch: players[i].watch !== undefined ? players[i].watch : false, // undefined check is for old leagues, can delete eventually
                        amount: players[i].contract.amount,
                        exp: players[i].contract.exp,
                        released: false
                    });
                }

                // Then, get any released players still owed money
                tx.objectStore("releasedPlayers").index("tid").getAll(options.key).onsuccess = function (event) {
                    var i, releasedPlayers;

                    releasedPlayers = event.target.result;

                    if (releasedPlayers.length === 0) {
                        return resolve(contracts);
                    }

                    for (i = 0; i < releasedPlayers.length; i++) {
                        (function (i) {
                            tx.objectStore("players").get(releasedPlayers[i].pid).onsuccess = function (event) {
                                var player;

                                player = event.target.result;
                                if (player !== undefined) { // If a player is deleted, such as if the user deletes retired players to improve performance, this will be undefined
                                    contracts.push({
                                        pid: releasedPlayers[i].pid,
                                        name: player.name,
                                        skills: player.ratings[player.ratings.length - 1].skills,
                                        injury: player.injury,
                                        amount: releasedPlayers[i].contract.amount,
                                        exp: releasedPlayers[i].contract.exp,
                                        released: true
                                    });
                                } else {
                                    contracts.push({
                                        pid: releasedPlayers[i].pid,
                                        name: "Deleted Player",
                                        skills: [],
                                        amount: releasedPlayers[i].contract.amount,
                                        exp: releasedPlayers[i].contract.exp,
                                        released: true
                                    });
                                }

                                if (contracts.length === players.length + releasedPlayers.length) {
                                    resolve(contracts);
                                }
                            };
                        }(i));
                    }
                };
            };
        });
    };



    gameAttributes = generateBasicDao("dbl", "gameAttributes", ["get"]);

    /**
     * Set values in the gameAttributes objectStore and update the global variable g.
     *
     * Items stored in gameAttributes are globally available through the global variable g. If a value is a constant across all leagues/games/whatever, it should just be set in globals.js instead.
     * 
     * @param {Object} gameAttributes Each property in the object will be inserted/updated in the database with the key of the object representing the key in the database.
     * @returns {Promise} Promise for when it finishes.
     */
    gameAttributes.set = function (gameAttributes) {
        return new Promise(function (resolve, reject) {
            var gameAttributesStore, i, key, toUpdate, tx;

            toUpdate = [];
            for (key in gameAttributes) {
                if (gameAttributes.hasOwnProperty(key)) {
                    if (g[key] !== gameAttributes[key]) {
                        toUpdate.push(key);
                    }
                }
            }

            tx = g.dbl.transaction("gameAttributes", "readwrite");
            gameAttributesStore = tx.objectStore("gameAttributes");

            for (i = 0; i < toUpdate.length; i++) {
                key = toUpdate[i];
                (function (key) {
                    gameAttributesStore.put({key: key, value: gameAttributes[key]}).onsuccess = function (event) {
                        g[key] = gameAttributes[key];
                    };

                    // Trigger a signal for the team finances view. This is stupid.
                    if (key === "gamesInProgress") {
                        if (gameAttributes[key]) {
                            $("#finances-settings, #free-agents, #live-games-list").trigger("gameSimulationStart");
                        } else {
                            $("#finances-settings, #free-agents, #live-games-list").trigger("gameSimulationStop");
                        }
                    }
                }(key));
            }

            tx.oncomplete = function () {
                // Trigger signal for the team finances view again, or else sometimes it gets stuck. This is even more stupid.
                if (gameAttributes.hasOwnProperty("gamesInProgress") && gameAttributes.gamesInProgress) {
                    $("#finances-settings, #free-agents, #live-games-list").trigger("gameSimulationStart");
                } else if (gameAttributes.hasOwnProperty("gamesInProgress") && !gameAttributes.gamesInProgress) {
                    $("#finances-settings, #free-agents, #live-games-list").trigger("gameSimulationStop");
                }

                resolve();
            };
        });
    };


    payrolls = {};

    /**
     * Get the total current payroll for a team.
     * 
     * This includes players who have been released but are still owed money from their old contracts.
     * 
     * @memberOf dao.payrolls
     * @param {IDBTransaction|null} options.ot An IndexedDB transaction on players and releasedPlayers; if null is passed, then a new transaction will be used.
     * @param {number} options.key Team ID.
     * @return {Promise.<number, Array=>} Resolves to an array; first argument is the payroll in thousands of dollars, second argument is the array of contract objects from dao.contracts.getAll.
     */
    payrolls.get = function (options) {
        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;
        options.key = options.key !== undefined ? options.key : null;

        return contracts.getAll({ot: options.ot, key: options.key}).then(function (contracts) {
            var i, payroll;

            payroll = 0;
            for (i = 0; i < contracts.length; i++) {
                payroll += contracts[i].amount;  // No need to check exp, since anyone without a contract for the current season will not have an entry
            }

            return [payroll, contracts];
        });
    };

    /**
     * Get the total current payroll for every team team.
     * 
     * @memberOf dao.payrolls
     * @param {IDBTransaction|null} options.ot An IndexedDB transaction on players and releasedPlayers; if null is passed, then a new transaction will be used.
     * @return {Promise} Resolves to an array of payrolls, ordered by team id.
     */
    payrolls.getAll = function (options) {
        var i, promises, tx;

        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;

        tx = getObjectStore(g.dbl, options.ot, ["players", "releasedPlayers"], null);

        promises = [];
        for (i = 0; i < g.numTeams; i++) {
            promises.push(payrolls.get({ot: tx, key: i}));
        }

        return Promise.all(promises);
    };



    players = generateBasicDao("dbl", "players", ["count", "put", "iterate"]);

    // This is intended just for getting the data from the database. Anything more sophisticated is in core.player.filter
    // filter: Arbitrary JS function to run on output with array.filter
    // statsSeasons: if "all", return all (needed for career totals, listing all years stats, etc). if undefined/null, return none (same as empty array input). otherwise, it's an array of seasons to return (usually just one year, but can be two for oldStats)
    // statsPlayoffs: if undefined/null, default is false. if true, include both regular season and playffs, otherwise just regular season. This is because player.filter doesn't like being given only playoff stats, for some reason.
    // statsTid: if undefined/null, return any team stats. otherwise, filter
    // 
    // Relevant SO links:
    // http://stackoverflow.com/questions/16501459/javascript-searching-indexeddb-using-multiple-indexes
    // http://stackoverflow.com/a/15625231/786644
    // can say "fix the first N elements of the index and let the other values be anything" http://stackoverflow.com/questions/26203075/querying-an-indexeddb-compound-index-with-a-shorter-array
    // http://stackoverflow.com/a/23808891/786644
    // http://stackoverflow.com/questions/12084177/in-indexeddb-is-there-a-way-to-make-a-sorted-compound-query
    players.getAll = function (options) {
        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;
        options.index = options.index !== undefined ? options.index : null;
        options.key = options.key !== undefined ? options.key : null;
        options.statsPlayoffs = options.statsPlayoffs !== undefined ? options.statsPlayoffs : false;
        options.statsTid = options.statsTid !== undefined ? options.statsTid : null;
        options.filter = options.filter !== undefined ? options.filter : null;

if (arguments[1] !== undefined) { throw new Error("No cb should be here"); }

        // By default, return no stats
        if (options.statsSeasons === undefined || options.statsSeasons === null) {
            options.statsSeasons = [];
        }

        return new Promise(function (resolve, reject) {
            var playerStore, tx;

            playerStore = getObjectStore(g.dbl, options.ot, ["players", "playerStats"], "players"); // Doesn't really need playerStats all the time
            tx = playerStore.transaction;

            if (options.index !== null) {
                playerStore = playerStore.index(options.index);
            }

            playerStore.getAll(options.key).onsuccess = function (event) {
                var done, i, pid, players;

                players = event.target.result;

                if (options.filter !== null) {
                    players = players.filter(options.filter);
                }

                done = 0;

                // Hacky way: always get all seasons for pid, then filter in JS
                if ((options.statsSeasons === "all" || options.statsSeasons.length > 0) && players.length > 0) {
                    for (i = 0; i < players.length; i++) {
                        pid = players[i].pid;

                        (function (i) {
                            var key;

                            if (options.statsSeasons === "all") {
                                // All seasons
                                key = IDBKeyRange.bound([pid], [pid, '']);
                            } else if (options.statsSeasons.length === 1) {
                                // Restrict to one season
                                key = IDBKeyRange.bound([pid, options.statsSeasons[0]], [pid, options.statsSeasons[0], '']);
                            } else if (options.statsSeasons.length > 1) {
                                // Restrict to range between seasons
                                key = IDBKeyRange.bound([pid, Math.min.apply(null, options.statsSeasons)], [pid, Math.max.apply(null, options.statsSeasons), '']);
                            }

                            tx.objectStore("playerStats").index("pid, season, tid").getAll(key).onsuccess = function (event) {
                                var playerStats;

                                playerStats = event.target.result;

                                // Due to indexes not necessarily handling all cases, still need to filter
                                players[i].stats = playerStats.filter(function (ps) {
                                    // statsSeasons is defined, but this season isn't in it
                                    if (options.statsSeasons !== "all" && options.statsSeasons.indexOf(ps.season) < 0) {
                                        return false;
                                    }

                                    // If options.statsPlayoffs is false, don't include playoffs. Otherwise, include both
                                    if (!options.statsPlayoffs && options.statsPlayoffs !== ps.playoffs) {
                                        return false;
                                    }

                                    if (options.statsTid !== null && options.statsTid !== ps.tid) {
                                        return false;
                                    }

                                    return true;
                                }).sort(function (a, b) {
                                    // Sort seasons in ascending order. This is necessary because the index will be ordering them by tid within a season, which is probably not what is ever wanted.
                                    return a.psid - b.psid;
                                });

                                done += 1;

                                if (done === players.length) {
// do I need to sort?
                                    resolve(players);
                                }
                            };
                        }(i));
                    }
                } else {
                    // No stats needed! Yay!
                    resolve(players);
                }
            };
        });
    };

    players.get = function (options) {
        return players.getAll(options).get(0);
    };

    players.putOriginal = players.put;
    players.put = function (options) {
        options = options !== undefined ? options : {};
        if (options.value.stats !== undefined) { throw new Error("stats property on player object"); }

        return players.putOriginal(options);
    };



    schedule = {};

    /**
     * Get an array of games from the schedule.
     * 
     * @param {(IDBObjectStore|IDBTransaction|null)} options.ot An IndexedDB object store or transaction on schedule; if null is passed, then a new transaction will be used.
     * @param {boolean} options.oneDay Number of days of games requested. Default false.
     * @return {Promise} Resolves to the requested schedule array.
     */
    schedule.get = function (options) {
        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;
        options.oneDay = options.oneDay !== undefined ? options.oneDay : false;

        return new Promise(function (resolve, reject) {
            var scheduleStore;

            scheduleStore = getObjectStore(g.dbl, options.ot, "schedule", "schedule");
            scheduleStore.getAll().onsuccess = function (event) {
                var i, schedule, tids;

                schedule = event.target.result;

                if (options.oneDay) {
                    schedule = schedule.slice(0, g.numTeams / 2);  // This is the maximum number of games possible in a day

                    // Only take the games up until right before a team plays for the second time that day
                    tids = [];
                    for (i = 0; i < schedule.length; i++) {
                        if (tids.indexOf(schedule[i].homeTid) < 0 && tids.indexOf(schedule[i].awayTid) < 0) {
                            tids.push(schedule[i].homeTid);
                            tids.push(schedule[i].awayTid);
                        } else {
                            break;
                        }
                    }
                    schedule = schedule.slice(0, i);
                }

                resolve(schedule);
            };
        });
    };

    /**
     * Save the schedule to the database, overwriting what's currently there.
     * 
     * @param {Array} tids A list of lists, each containing the team IDs of the home and
            away teams, respectively, for every game in the season, respectively.
     * @return {Promise}
     */
    schedule.set = function (tids) {
        return new Promise(function (resolve, reject) {
            var i, row, schedule, scheduleStore, tx;

            schedule = [];
            for (i = 0; i < tids.length; i++) {
                row = {homeTid: tids[i][0], awayTid: tids[i][1]};
                schedule.push(row);
            }

            tx = g.dbl.transaction("schedule", "readwrite");
            scheduleStore = tx.objectStore("schedule");
            scheduleStore.getAll().onsuccess = function (event) {
                var currentSchedule, i;

                currentSchedule = event.target.result;
                for (i = 0; i < currentSchedule.length; i++) {
                    scheduleStore.delete(currentSchedule[i].gid);
                }

                for (i = 0; i < schedule.length; i++) {
                    scheduleStore.add(schedule[i]);
                }
            };
            tx.oncomplete = function () {
                resolve();
            };
        });
    };



    return {
        tx: tx,
        leagues: generateBasicDao("dbm", "leagues", ["get", "getAll", "add"]),
        achievements: generateBasicDao("dbm", "achievements", ["getAll"]),
        awards: generateBasicDao("dbl", "awards", ["get"]),
        contracts: contracts,
        draftOrder: generateBasicDao("dbl", "draftOrder", ["get", "put"]),
        draftPicks: generateBasicDao("dbl", "draftPicks", ["getAll", "add", "delete"]),
        events: generateBasicDao("dbl", "events", ["getAll"]),
        gameAttributes: gameAttributes,
        games: generateBasicDao("dbl", "games", ["count"]),
        messages: generateBasicDao("dbl", "messages", ["getAll", "add"]),
        negotiations: generateBasicDao("dbl", "negotiations", ["get", "getAll", "count", "delete", "clear"]),
        payrolls: payrolls,
        players: players,
        playoffSeries: generateBasicDao("dbl", "playoffSeries", ["get", "put"]),
        releasedPlayers: generateBasicDao("dbl", "releasedPlayers", ["clear"]),
        schedule: schedule,
        teams: generateBasicDao("dbl", "teams", ["get", "getAll", "iterate"])
    };
});