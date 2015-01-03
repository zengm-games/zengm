define(["globals", "lib/bluebird", "lib/jquery"], function (g, Promise, $) {
    "use strict";

    var players;

    /**
     * Create an IndexedDB transaction whose oncomplete event can be accessed as a promise.
     * 
     * This is the same as IDBRequest.transaction except the returned transaction has a "complete" property, which contains a function that returns a promise which resolves when the oncomplete event of the transaction fires.
     */
    function tx_(storeNames, mode, tx0) {
        var tx;

        // If tx0 is something, short circuit
        if (tx0 !== undefined && tx0 !== null) {
            return tx0;
        }

        if (storeNames === "achievements") {
            tx = g.dbm.transaction(storeNames, mode);
        } else {
            tx = g.dbl.transaction(storeNames, mode);
        }

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

    function generateBasicDao(dbmOrDbl, objectStore) {
        var methods;

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

        /**
         * Iterate over objects in an object store, optionally modifying them.
         *
         * This is a wrapper for openCursor. The "key" and "direction" parameters define how we're opening the cursor. Then, "callback" is a function that runs on each object retrieved.
         * 
         * The arguments passed to callback are the object itself and a function that will short circuit the iteration if called.
         *
         * If you return a promise within callback, the next iteration won't begin until the promise resolves.
         *
         * If you return (or resolve to) something besides undefined, that value will be used to overwrite the original value for the object.
         */
        methods.iterate = function (options) {
            options = options !== undefined ? options : {};
            options.ot = options.ot !== undefined ? options.ot : null;
            options.index = options.index !== undefined ? options.index : null;
            options.key = options.key !== undefined ? options.key : null;
            options.direction = options.direction !== undefined ? options.direction : "next";
            options.callback = options.callback !== undefined ? options.callback : null;

            return new Promise(function (resolve, reject) {
                var objectStoreOrIndex;

                // Default to readonly transaction. If you want readwrite, manually pass a transaction.
                objectStoreOrIndex = getObjectStore(g[dbmOrDbl], options.ot, objectStore, objectStore);

                if (options.index !== null) {
                    objectStoreOrIndex = objectStoreOrIndex.index(options.index);
                }

                objectStoreOrIndex.openCursor(options.key, options.direction).onsuccess = function (event) {
                    var cursor, callbackResult, shortCircuit;

                    cursor = event.target.result;

                    if (cursor) {
                        if (options.callback !== null) {
                            shortCircuit = false;

                            callbackResult = options.callback(cursor.value, function () {
                                shortCircuit = true;
                            });

                            // Return a promise: waits until resolved to continue
                            // Return a value: immediately continue
                            // Return or resolve to undefined: no update (otherwise update)
                            Promise.resolve(callbackResult).then(function (updatedValue) {
                                // Only update if return value is not undefined
                                if (updatedValue !== undefined) {
                                    cursor.update(updatedValue);
                                }

                                // Allow short circuiting
                                if (shortCircuit) {
                                    resolve();
                                } else {
                                    cursor.continue();
                                }
                            });
                        }
                    } else {
                        resolve();
                    }
                };
            });
        };

        return methods;
    }


    players = generateBasicDao("dbl", "players");

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

    return {
        tx: tx_,
        leagues: generateBasicDao("dbm", "leagues"),
        achievements: generateBasicDao("dbm", "achievements"),
        awards: generateBasicDao("dbl", "awards"),
        draftOrder: generateBasicDao("dbl", "draftOrder"),
        draftPicks: generateBasicDao("dbl", "draftPicks"),
        events: generateBasicDao("dbl", "events"),
        gameAttributes: generateBasicDao("dbl", "gameAttributes"),
        games: generateBasicDao("dbl", "games"),
        messages: generateBasicDao("dbl", "messages"),
        negotiations: generateBasicDao("dbl", "negotiations"),
        players: players,
        playerStats: generateBasicDao("dbl", "playerStats"),
        playoffSeries: generateBasicDao("dbl", "playoffSeries"),
        releasedPlayers: generateBasicDao("dbl", "releasedPlayers"),
        schedule: generateBasicDao("dbl", "schedule"),
        teams: generateBasicDao("dbl", "teams"),
        trade: generateBasicDao("dbl", "trade")
    };
});