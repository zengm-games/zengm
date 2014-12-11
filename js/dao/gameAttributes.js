define(["db", "globals", "lib/jquery", "lib/bluebird"], function (db, g, $, Promise) {
    "use strict";

    function get(options) {
        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;
        options.key = options.key !== undefined ? options.key : null;

        return new Promise(function (resolve, reject) {
            db.getObjectStore(options.ot, "gameAttributes", "gameAttributes").get(options.key).onsuccess = function (event) {
                resolve(event.target.result);
            };
        });
    }

    /**
     * Set values in the gameAttributes objectStore and update the global variable g.
     *
     * Items stored in gameAttributes are globally available through the global variable g. If a value is a constant across all leagues/games/whatever, it should just be set in globals.js instead.
     * 
     * @param {Object} gameAttributes Each property in the object will be inserted/updated in the database with the key of the object representing the key in the database.
     * @returns {Promise} Promise for when it finishes.
     */
    function set(gameAttributes) {
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
    }

    return {
        get: get,
        set: set
    };
});