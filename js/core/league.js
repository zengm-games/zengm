/**
 * @name core.league
 * @namespace Creating and removing leagues.
 */
define(["db", "ui", "core/player", "core/season", "lib/faces", "util/helpers", "util/random"], function (db, ui, player, season, faces, helpers, random) {
    "use strict";

    /**
     * Create a new league.
     * 
     * @memberOf core.league
     * @param {string} name The name of the league.
     * @param {number} tid The team ID for the team the user wants to manage.
     * @param {string} playerGeneration Either "random" to generate random players or "nba2012" to load NBA rosters.
     */
    function create(name, tid, playerGeneration, cb) {
        var l, leagueStore;

        l = {name: name, tid: tid, phaseText: ""};
        leagueStore = g.dbm.transaction("leagues", "readwrite").objectStore("leagues");
        leagueStore.add(l).onsuccess = function (event) {
            g.lid = event.target.result;

            g.dbm.transaction("teams").objectStore("teams").getAll().onsuccess = function (event) {
                var teams;

                teams = event.target.result;

                // Create new league database
                db.connectLeague(g.lid, function () {
                    var gameAttributes, key, startingSeason;

                    startingSeason = 2013;
                    gameAttributes = {userTid: tid, season: startingSeason, startingSeason: startingSeason, phase: 0, gamesInProgress: false, stopGames: false, lastDbChange: 0, leagueName: name};

                    // Clear old game attributes from g, to make sure the new ones are saved to the db in db.setGameAttributes
                    helpers.resetG();

                    db.setGameAttributes(gameAttributes, function () {
                        var afterPlayerCreation, agingYears, baseRatings, contract, done, draftYear, goodNeutralBad, i, n, p, playerStore, pots, profile, profiles, randomizeExpiration, t, tid, teamStore, transaction;

                        // Probably is fastest to use this transaction for everything done to create a new league
                        transaction = g.dbl.transaction(["draftOrder", "players", "teams", "trade"], "readwrite");

                        // Initialize draft order object store for later use
                        transaction.objectStore("draftOrder").add({
                            rid: 1,
                            draftOrder: []
                        });

                        // teams already contains tid, cid, did, region, name, and abbrev. Let's add in the other keys we need for the league.
                        teamStore = transaction.objectStore("teams");
                        for (i = 0; i < teams.length; i++) {
                            teamStore.add({
                                tid: teams[i].tid,
                                cid: teams[i].cid,
                                did: teams[i].did,
                                region: teams[i].region,
                                name: teams[i].name,
                                abbrev: teams[i].abbrev,
                                stats: [{season: g.startingSeason, playoffs: false, gp: 0, min: 0, fg: 0, fga: 0, fgAtRim: 0, fgaAtRim: 0, fgLowPost: 0, fgaLowPost: 0, fgMidRange: 0, fgaMidRange: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, trb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0, oppPts: 0}], // Things recorded both in and out of playoffs
                                seasons: [{season: g.startingSeason, gp: 0, att: 0, revenue: 0, cost: 0, cash: 10000, won: 0, lost: 0, wonHome: 0, lostHome: 0, wonAway: 0, lostAway: 0, wonDiv: 0, lostDiv: 0, wonConf: 0, lostConf: 0, lastTen: [], streak: 0, madePlayoffs: false, confChamps: false, leagueChamps: false}] // Things that only have one value per season
                            });
                        }

                        transaction.objectStore("trade").add({
                            rid: 0,
                            otherTid: tid === 0 ? 1 : 0,  // Load initial trade view with the lowest-numbered non-user team (so, either 0 or 1)
                            otherPids: [],
                            userPids: []
                        });

                        // This can't be in transaction.oncomplete because loading players from a json file is async and breaks the transaction.
                        afterPlayerCreation = function () {
                            // Make schedule, start season
                            season.newPhase(c.PHASE_REGULAR_SEASON, function () {
                                var lid;

                                ui.updateStatus('Idle');

                                lid = g.lid;  // Otherwise, g.lid can be overwritten before the URL redirects, and then we no longer now the league ID

                                // Auto sort player's roster (other teams will be done in season.newPhase(c.PHASE_REGULAR_SEASON))
                                db.rosterAutoSort(null, g.userTid, function () { cb(lid); });

                                helpers.bbgmPing("league");
                            });
                        };

                        if (playerGeneration === "nba2012") {
                            // Load players from file
                            $.getJSON("/data/nba2012.json", function (players) {
                                var cont, i, p, playerStore;

                                playerStore = g.dbl.transaction("players", "readwrite").objectStore("players");  // Transaction used above is closed by now

                                done = 0;
                                for (i = 0; i < players.length; i++) {
                                    p = players[i];
                                    p.ratings[0].ovr = player.ovr(p.ratings[0]);
                                    p.face = faces.generate();
                                    if (p.tid === c.PLAYER_FREE_AGENT) {
                                        cont = player.contract(p.ratings[0]);
                                        p.contractAmount = cont.amount;
                                        p.contractExp = cont.exp;
                                    }
                                    db.putPlayer(playerStore, p, function () {
                                        done += 1;
                                        if (done === players.length) {
                                            afterPlayerCreation();
                                        }
                                    });
                                }
                            });
                        } else {
                            // Generate new players
                            playerStore = transaction.objectStore("players");
                            profiles = ["Point", "Wing", "Big", ""];
                            baseRatings = [37, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 26, 26, 26];
                            pots = [75, 65, 55, 55, 60, 50, 70, 40, 55, 50, 60, 60, 45, 45];

                            done = 0;
                            for (t = -3; t < 30; t++) {
                                // Create multiple "teams" worth of players for the free agent pool
                                if (t < 0) {
                                    tid = c.PLAYER_FREE_AGENT;
                                } else {
                                    tid = t;
                                }

                                goodNeutralBad = random.randInt(-1, 1);  // determines if this will be a good team or not
                                random.shuffle(pots);
                                for (n = 0; n < 14; n++) {
                                    profile = profiles[random.randInt(0, profiles.length - 1)];
                                    agingYears = random.randInt(0, 13);
                                    draftYear = g.startingSeason - 1 - agingYears;

                                    p = player.generate(tid, 19, profile, baseRatings[n], pots[n], draftYear, true);
                                    p = player.develop(p, agingYears, true);
                                    if (n < 5) {
                                        p = player.bonus(p, goodNeutralBad * random.randInt(0, 20), true);
                                    } else {
                                        p = player.bonus(p, 0, true);
                                    }
                                    if (t === -1) {  // Free agents
                                        p = player.bonus(p, -15, false);
                                    }

                                    db.putPlayer(playerStore, p, function () {
                                        done += 1;
                                        if (done === 31 * 14) {
                                            afterPlayerCreation();
                                        }
                                    });
                                }
                            }
                        }
                    });
                });
            };
        };
    }

    /**
     * Delete an existing league.
     * 
     * @memberOf core.league
     * @param {number} lid League ID.
     * @param {function()=} cb Optional callback.
     */
    function remove(lid, cb) {
        var request;

        if (g.dbl !== undefined) {
            g.dbl.close();
        }

        g.dbm.transaction("leagues", "readwrite").objectStore("leagues").delete(lid);
        request = indexedDB.deleteDatabase("league" + lid);
        request.onsuccess = function (event) {
            console.log("Database league" + lid + " successfully deleted");
            cb();
        };
        request.onfailure = function (event) {
            console.log("Error: ", event);
            cb();
        };
        request.onblocked = function (event) {
            console.log("Blocked: ", event);
            cb();
        };
    }


    /**
     * Export an existing league.
     * 
     * @memberOf core.league
     * @param {number} lid League ID.
     * @param {function(Object)} cb Callback whose first argument contains all the exported league data.
     */
    function export_(lid, cb) {
        if (g.dbl !== undefined) {
            g.dbl.close();
        }

        g.dbm.transaction("leagues").objectStore("leagues").get(lid).onsuccess = function (event) {
            var exportedLeague;

            exportedLeague = {};

            // Row from leagueStore
            exportedLeague.metadata = event.target.result;

            db.connectLeague(lid, function () {
                var exportStore, stores;

                stores = ["players", "teams", "games", "schedule", "playoffSeries", "releasedPlayers", "awards", "trade", "draftOrder", "negotiations", "gameAttributes"];

                exportStore = function (i, cb) {
                    console.log("Exporting " + stores[i] + "...");
                    g.dbl.transaction(stores[i]).objectStore(stores[i]).getAll().onsuccess = function (event) {
                        exportedLeague[stores[i]] = event.target.result;

                        if (i > 0) {
                            exportStore(i - 1, cb);
                        } else {
                            cb(exportedLeague);
                        }
                    };
                };

                // Iterate through all the stores
                exportStore(stores.length - 1, cb);
            });
        };
    }

    return {
        create: create,
        export_: export_,
        remove: remove
    };
});