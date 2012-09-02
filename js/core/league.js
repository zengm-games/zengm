/**
 * @name core.league
 * @namespace Creating and removing leagues.
 */
define(["db", "ui", "core/player", "core/season", "util/helpers", "util/random"], function (db, ui, player, season, helpers, random) {
    "use strict";

    /**
     * Create a new league.
     * 
     * @memberOf core.league
     * @param {number} tid The team ID for the team the user wants to manage.
     * @param {string} playerGeneration Either "random" to generate random players or "nba2012" to load NBA rosters.
     */
    function create(tid, playerGeneration, cb) {
        var l, leagueStore;

        l = {tid: tid};
        leagueStore = g.dbm.transaction(["leagues"], "readwrite").objectStore("leagues");
        leagueStore.add(l).onsuccess = function (event) {
            var t;

            g.lid = event.target.result;
            t = event.target.transaction;
            g.dbm.transaction(["teams"]).objectStore("teams").getAll().onsuccess = function (event) {
                var teams;

                teams = event.target.result;

                // Create new league database
                db.connectLeague(g.lid, function () {
                    var afterPlayerCreation, agingYears, baseRatings, contract, done, draftYear, gameAttributes, goodNeutralBad, i, n, p, playerStore, pots, profile, profiles, randomizeExpiration, t, teamStore, transaction;

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
                            stats: [{season: g.startingSeason, playoffs: false, gp: 0, min: 0, fg: 0, fga: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, trb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0, oppPts: 0}], // Things recorded both in and out of playoffs
                            seasons: [{season: g.startingSeason, gp: 0, att: 0, cost: 0, cash: 10000000, won: 0, lost: 0, wonHome: 0, lostHome: 0, wonAway: 0, lostAway: 0, wonDiv: 0, lostDiv: 0, wonConf: 0, lostConf: 0, lastTen: [], streak: 0, madePlayoffs: false, confChamps: false, leagueChamps: false}] // Things that only have one value per season
                        });
                    }

                    transaction.objectStore("trade").add({
                        rid: 0,
                        otherTid: tid === 0 ? 1 : 0,
                        otherPids: [],
                        userPids: []
                    });

                    afterPlayerCreation = function () {
                        gameAttributes = {userTid: tid, season: g.startingSeason, phase: 0, gamesInProgress: false, stopGames: false};
                        helpers.setGameAttributes(gameAttributes);

                        localStorage.setItem("league" + g.lid + "Negotiations", JSON.stringify([]));

                        // Make schedule, start season
                        season.newPhase(c.PHASE_REGULAR_SEASON, function () {
                            ui.updateStatus('Idle');

                            // Auto sort player's roster (other teams will be done in season.newPhase(c.PHASE_REGULAR_SEASON))
                            db.rosterAutoSort(null, g.userTid, cb);
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
                        baseRatings = [30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 19, 19];
                        pots = [70, 60, 50, 50, 55, 45, 65, 35, 50, 45, 55, 55, 40, 40];

                        done = 0;
                        for (t = -1; t < 30; t++) {
                            goodNeutralBad = random.randInt(-1, 1);  // determines if this will be a good team or not
                            random.shuffle(pots);
                            for (n = 0; n < 14; n++) {
                                profile = profiles[random.randInt(0, profiles.length - 1)];
                                agingYears = random.randInt(0, 13);
                                draftYear = g.startingSeason - 1 - agingYears;

                                p = player.generate(t, 19, profile, baseRatings[n], pots[n], draftYear, true);
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
            };
        };
    }

    /**
     * Delete an existing league.
     * 
     * @memberOf core.league
     * @param {number} lid League ID.
     */
    function remove(lid, cb) {
        var request;

        if (typeof g.dbl !== "undefined") {
            g.dbl.close();
        }

        g.dbm.transaction(["leagues"], "readwrite").objectStore("leagues").delete(lid);
        request = g.indexedDB.deleteDatabase("league" + lid);
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
        localStorage.removeItem("league" + g.lid + "GameAttributes");
        localStorage.removeItem("league" + g.lid + "Negotiations");
    }

    return {
        create: create,
        remove: remove
    };
});