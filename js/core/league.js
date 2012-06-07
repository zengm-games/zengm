var league = {
    new: function (tid) {
        l = {'tid': tid, 'season': startingSeason, 'phase': 0, 'games_in_progress': false, 'stop_game': false, 'pm_status': '', 'pm_phase': 'Phase 1'}
        var leaguesStore = dbm.transaction(["leagues"], IDBTransaction.READ_WRITE).objectStore("leagues");
        leaguesStore.add(l).onsuccess = function (event) {
            lid = event.target.result;
            t = event.target.transaction;
            db.getAll(dbm, "teams", function (teams) {
console.log(teams);
                // Create new league database
                request = db.connect_league(lid);
                request.onsuccess = function (event) {
                    dbl = request.result;
                    dbl.onerror = function (event) {
                        console.log("League database error: " + event.target.errorCode);
                    };

                    // Probably is fastest to use this transaction for everything done to create a new league
                    var transaction = dbl.transaction(["teams"], IDBTransaction.READ_WRITE);

                    // teams already contains tid, cid, did, region, name, and abbrev. Let's add in the other keys we need for the league.
                    var teamStore = transaction.objectStore("teams")
                    for (i in teams) {
                        teamStore.add({
//                            rid: teams[i]['tid'], // This shouldn't be necessary if autoincrement is working on this store http://www.raymondcamden.com/index.cfm/2012/4/26/Sample-of-IndexedDB-with-Autogenerating-Keys
                            tid: teams[i]['tid'],
                            cid: teams[i]['cid'],
                            did: teams[i]['did'],
                            region: teams[i]['region'],
                            name: teams[i]['name'],
                            abbrev: teams[i]['abbrev'],
                            season: startingSeason,
                            won: 0,
                            lost: 0,
                            won_div: 0,
                            lost_div: 0,
                            won_conf: 0,
                            lost_conf: 0,
                            cash: 10000000,
                            playoffs: false,
                            conf_champs: false,
                            league_champs: false
                        });
                    }
/*        # Add to main record
        # Copy in teams
        g.dbexmany('INSERT INTO team_attributes (tid, did, name, region, abbrev, season) VALUES (:tid, :did, :name, :region, :abbrev, %d)' % (int(g.starting_season),), teams)

        # Generate new players
        profiles = ['Point', 'Wing', 'Big', '']
        gp = player.GeneratePlayer()
        pid = 1
        player_attributes = []
        player_ratings = []
        for t in range(-1, 30):
            good_neutral_bad = random.randrange(-1, 2)  # Determines if this will be a good team or not

            base_ratings = [30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 19, 19]
            pots = [70, 60, 50, 50, 55, 45, 65, 35, 50, 45, 55, 55, 40, 40]
            random.shuffle(pots)
            for p in range(14):
                i = random.randrange(len(profiles))
                profile = profiles[i]

                aging_years = random.randint(0, 16)

                draft_year = g.starting_season - 1 - aging_years

                gp.new(pid, t, 19, profile, base_ratings[p], pots[p], draft_year)
                gp.develop(aging_years)
                if p < 5:
                    gp.bonus(good_neutral_bad * random.randint(0, 20))
                if t == -1:  # Free agents
                    gp.bonus(-15)

                # Update contract based on development
                if t >= 0:
                    randomize_expiration = True  # Players on teams already get randomized contracts
                else:
                    randomize_expiration = False
                amount, expiration = gp.contract(randomize_expiration=randomize_expiration)
                gp.attribute['contract_amount'], gp.attribute['contract_exp'] = amount, expiration

                player_attributes.append(gp.get_attributes())
                player_ratings.append(gp.get_ratings())

                pid += 1
        g.dbexmany('INSERT INTO player_attributes (%s) VALUES (%s)' % (', '.join(player_attributes[0].keys()), ', '.join([':' + key for key in player_attributes[0].keys()])), player_attributes)
        g.dbexmany('INSERT INTO player_ratings (%s) VALUES (%s)' % (', '.join(player_ratings[0].keys()), ', '.join([':' + key for key in player_ratings[0].keys()])), player_ratings)

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
                }
            });

            Davis.location.assign(new Davis.Request('/l/' + lid));
        };
    },


    delete: function (lid) {
        var leaguesStore = dbm.transaction(["leagues"], IDBTransaction.READ_WRITE).objectStore("leagues").delete(lid);
        indexedDB.deleteDatabase("league" + lid);
//        g.dbex('DROP DATABASE bbgm_%s' % (lid,))
//        g.dbex('DELETE FROM leagues WHERE lid = :lid', lid=lid)
    }
}
