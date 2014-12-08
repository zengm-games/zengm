define(["db", "lib/bluebird"], function (db, Promise) {
    "use strict";

    /**
     * Gets all the contracts a team owes.
     * 
     * This includes contracts for players who have been released but are still owed money.
     * 
     * @memberOf db
     * @param {IDBTransaction|null} options.ot An IndexedDB transaction on players and releasedPlayers; if null is passed, then a new transaction will be used.
     * @param {number} options.tid Team ID.
     * @returns {Promise.Array} Array of objects containing contract information.
     */
    function getAll(options) {
        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;
        options.tid = options.tid !== undefined ? options.tid : null;

        return new Promise(function (resolve, reject) {
            var contracts, transaction;

            transaction = db.getObjectStore(options.ot, ["players", "releasedPlayers"], null);

            // First, get players currently on the roster
            transaction.objectStore("players").index("tid").getAll(options.tid).onsuccess = function (event) {
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
                transaction.objectStore("releasedPlayers").index("tid").getAll(options.tid).onsuccess = function (event) {
                    var i, releasedPlayers;

                    releasedPlayers = event.target.result;

                    if (releasedPlayers.length === 0) {
                        return resolve(contracts);
                    }

                    for (i = 0; i < releasedPlayers.length; i++) {
                        (function (i) {
                            transaction.objectStore("players").get(releasedPlayers[i].pid).onsuccess = function (event) {
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
    }

    return {
        getAll: getAll
    };
});