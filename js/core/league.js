define(["db", "core/player", "util/random"], function(db, player, random) {
    function new_(tid) {
        l = {'tid': tid, 'season': g.startingSeason, 'phase': 0, 'games_in_progress': false, 'stop_game': false, 'pm_status': '', 'pm_phase': 'Phase 1'}
        var leaguesStore = g.dbm.transaction(["leagues"], IDBTransaction.READ_WRITE).objectStore("leagues");
        leaguesStore.add(l).onsuccess = function (event) {
            lid = event.target.result;
            t = event.target.transaction;
            db.getAll(g.dbm, "teams", function (teams) {
console.log(teams);
                // Create new league database
                request = db.connect_league(lid);
                request.onsuccess = function (event) {
                    g.dbl = request.result;
                    g.dbl.onerror = function (event) {
                        console.log("League database error: " + event.target.errorCode);
                    };

                    // Probably is fastest to use this transaction for everything done to create a new league
                    var transaction = g.dbl.transaction(["players", "teams"], IDBTransaction.READ_WRITE);

                    // teams already contains tid, cid, did, region, name, and abbrev. Let's add in the other keys we need for the league.
                    var teamStore = transaction.objectStore("teams");
                    for (var i=0; i<teams.length; i++) {
                        teamStore.add({
//                            rid: teams[i]['tid'], // This shouldn't be necessary if autoincrement is working on this store http://www.raymondcamden.com/index.cfm/2012/4/26/Sample-of-IndexedDB-with-Autogenerating-Keys
                            tid: teams[i]['tid'],
                            cid: teams[i]['cid'],
                            did: teams[i]['did'],
                            region: teams[i]['region'],
                            name: teams[i]['name'],
                            abbrev: teams[i]['abbrev'],
                            season: g.startingSeason,
                            won: 0,
                            lost: 0,
                            wonDiv: 0,
                            lostDiv: 0,
                            wonConf: 0,
                            lostConf: 0,
                            cash: 10000000,
                            madePlayoffs: false,
                            confChamps: false,
                            leagueChamps: false,
                            stats: [{
                                playoffs: false,
                                gp: 0,
                                min: 0,
                                fg: 0,
                                fga: 0,
                                tp: 0,
                                tpa: 0,
                                ft: 0,
                                fta: 0,
                                orb: 0,
                                drb: 0,
                                ast: 0,
                                tov: 0,
                                stl: 0,
                                blk: 0,
                                pf: 0,
                                pts: 0,
                                oppPts: 0,
                                att: 0
                            }]
                        });
                    }

                    // Generate new players
                    var playerStore = transaction.objectStore("players");
                    var profiles = ['Point', 'Wing', 'Big', ''];
                    var pid = 1;
                    var playerAttributes = [];
                    var playerRatings = [];
                    var baseRatings = [30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 19, 19];
                    var pots = [70, 60, 50, 50, 55, 45, 65, 35, 50, 45, 55, 55, 40, 40];
                    for (t=-1; t<30; t++) {
console.log('t: ' + t);
                        var goodNeutralBad = random.randInt(-1, 1);  // determines if this will be a good team or not
                        random.shuffle(pots);
                        for (p=0; p<14; p++) {
console.log('t: ' + t + ', p: ' + p);
                            var agingYears = random.randInt(0, 13);
                            var draftYear = g.startingSeason - 1 - agingYears;

                            var gp = new player.Player(pid);
                            gp.generate(t, 19, profiles[random.randInt(profiles.length)], baseRatings[p], pots[p], draftYear);
                            gp.develop(agingYears, true);
                            if (p < 5) {
                                gp.bonus(goodNeutralBad * random.randInt(0, 20));
                            }
                            if (t == -1) {  // Free agents
                                gp.bonus(-15);
                            }

                            // Update contract based on development
                            if (t >= 0) {
                                var randomizeExpiration = true;  // Players on teams already get randomized contracts
                            }
                            else {
                                var randomizeExpiration = false;
                            }
                            contract = gp.contract(randomizeExpiration=randomizeExpiration);
                            gp.attribute["contractAmount"] = contract.amount;
                            gp.attribute["contractExp"] = contract.exp;

                            var entry = gp.attribute;
console.log(entry);
                            entry.ratings = [gp.rating];
                            entry.ratings[0].season = g.startingSeason;
                            entry.stats = [{season: g.startingSeason, playoffs: false, gp: 0, gs: 0, min: 0, fg: 0, fga: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0}];
                            playerStore.add(entry);

                            pid += 1
                        }
                    }
//                    console.log(playerAttributes[4]);
//                    console.log(playerRatings[4]);
/*
        # Set and get global game attributes
        g.dbex('UPDATE game_attributes SET tid = :tid', tid=tid)
        r = g.dbex('SELECT tid, season, phase, version FROM game_attributes LIMIT 1')
        g.user_tid, g.season, g.phase, g.version = r.fetchone()

        # Make schedule, start season
        season.new_phase(c.PHASE_REGULAR_SEASON)
        play_menu.set_status('Idle')

        # Auto sort player's roster (other teams will be done in season.new_phase(c.PHASE_REGULAR_SEASON))
        roster_auto_sort(g.user_tid)

        # Default trade settings
        if g.user_tid == 0:
            trade_tid = 1
        else:
            trade_tid = 0
        g.dbex('INSERT INTO trade (tid) VALUES (:tid)', tid=trade_tid)
*/

                    Davis.location.assign(new Davis.Request('/l/' + lid));
                }
            });
        };
    }


    function delete_(lid) {
        var leaguesStore = g.dbm.transaction(["leagues"], IDBTransaction.READ_WRITE).objectStore("leagues").delete(lid);
        indexedDB.deleteDatabase("league" + lid);
//        g.dbex('DROP DATABASE bbgm_%s' % (lid,))
//        g.dbex('DELETE FROM leagues WHERE lid = :lid', lid=lid)
    }

    return {
        new: new_,
        delete: delete_
    };
});
