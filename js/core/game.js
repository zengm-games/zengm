define(["core/gameSim", "util/lock", "util/playMenu", "util/random"], function(gameSim, lock, playMenu, random) {
    function Game() {
    }

    Game.prototype.load = function(results, playoffs) {
        // Retrieve stats
        this.team = results['team'];
        this.playoffs = playoffs;
        this.id = results['gid'];
        this.home = [true, false];
//console.log(this.team);

        // What is the attendance of the game?
        winp = 0;
        gp = this.team[0].gp + this.team[1].gp;
        if (gp > 0) {
            winp = (this.team[0].won + this.team[1].won) / gp;
        }
        if (gp < 5) {
            this.att = random.gauss(22000 + gp * 1000, 1000);
        }
        else {
            this.att = random.gauss(winp * 36000, 1000);
        }
        if (this.att > 25000) {
            this.att = 25000;
        }
        else if (this.att < 10000) {
            this.att = 10000;
        }

        // Are the teams in the same conference/division?
        this.same_conference = false;
        this.same_division = false;
        cid = [-1, -1];
        did = [-1, -1];
        if (this.team[0].cid == this.team[1].cid) {
            this.same_conference = true;
        }
        if (this.team[0].did == this.team[1].did) {
            this.same_division = true;
        }
    }

    Game.prototype.writeStats = function(callback) {
        this.teamsRemaining = 2;
        this.playersRemaining = this.team[0].player.length + this.team[1].player.length;
        this.callback = callback;

        var transaction = g.dbl.transaction(["players", "teams"], IDBTransaction.READ_WRITE);
        // Record who the starters are
/*    for (var t=0; t<2; t++) {
        r = g.dbex('SELECT pid FROM player_attributes WHERE tid = :tid ORDER BY roster_order ASC LIMIT 5', tid=this.team[t]['id'])
        for starter_id, in r.fetchall() {
            for (p=0; p<this.team[t]['player'].length; p++) {
                if (this.team[t]['player'][p]['id'] == starter_id) {
                    this.team[t]['player'][p]['stat']['gs'] = 1;
                }
            }
        }
    }*/

        // Player stats and team stats
        var that = this;
        var playerStore = g.dbl.transaction(["players"], IDBTransaction.READ_WRITE).objectStore("players");
        for (var t=0; t<2; t++) {
            this.writeTeamStats(t);
            for (var p=0; p<this.team[t].player.length; p++) {
                playerStore.openCursor(IDBKeyRange.only(this.team[t].player[p].id)).onsuccess = function(event) {
                    var cursor = event.target.result;
                    player = cursor.value;

                    // Find the correct row of stats
                    for (var i=0; i<player.stats.length; i++) {
                        if (player.stats[i].season == g.season && player.stats[i].playoffs == that.playoffs) {
                            playerStats = player.stats[i];
                            break;
                        }
                    }

                    // Which team is this, again?
                    if (player.tid == that.team[0].id) {
                        var t = 0;
                    }
                    else {
                        var t = 1;
                    }

                    // Which player is this, again?
                    for (var p=0; p<that.team[t].player.length; p++) {
                        if (player.pid == that.team[t].player[p].id) {
                            break;
                        }
                    }

                    // Update stats
                    keys = ['min', 'fg', 'fga', 'tp', 'tpa', 'ft', 'fta', 'orb', 'drb', 'ast', 'tov', 'stl', 'blk', 'pf', 'pts'];
                    for (var i=0; i<keys.length; i++) {
                        playerStats[keys[i]] += that.team[t].player[p].stat[keys[i]];
                    }
                    playerStats.gp += 1;

                    cursor.update(player);

                    that.playersRemaining -= 1;
                    if (that.playersRemaining == 0 && that.teamsRemaining == 0) {
                        that.callback();
                    }
                }
            }
        }
    }

    Game.prototype.writeTeamStats = function(t) {
        if (t == 0) {
            t2 = 1;
        }
        else {
            t2 = 0;
        }
        var that = this;
        g.dbl.transaction(["teams"], IDBTransaction.READ_WRITE).objectStore("teams").index("tid").openCursor(IDBKeyRange.only(that.team[t].id)).onsuccess = function(event) {
            var cursor = event.target.result;
            teamSeason = cursor.value;
            if (teamSeason.season != g.season) {
                cursor.continue();
            }
//console.log('won ' + teamSeason.won);
//console.log(teamSeason.stats);

            teamStats = teamSeason.stats[0];
//console.log(teamStats);
            if (teamStats.playoffs != that.playoffs) {
                teamStats = teamSeason.stats[1];
            }
//console.log(that);

            if (that.team[t]['stat']['pts'] > that.team[t2]['stat']['pts']) {
                won = true;
/*            if (this.playoffs && t == 0) {
                g.dbex('UPDATE playoff_series SET won_home = won_home + 1 WHERE tid_home = :tid_home AND tid_away = :tid_away AND season = :season', tid_home=this.team[t]['id'], tid_away=this.team[t2]['id'], season=g.season)
            }
            else if (this.playoffs) {
                g.dbex('UPDATE playoff_series SET won_away = won_away + 1 WHERE tid_home = :tid_home AND tid_away = :tid_away AND season = :season', tid_home=this.team[t2]['id'], tid_away=this.team[t]['id'], season=g.season)
            }*/
            }
            else {
                won = false;
            }

            // Only pay player salaries for regular season games.
/*    if (!this.playoffs) {
        r = g.dbex('SELECT SUM(contract_amount) * 1000 / 82 FROM released_players_salaries WHERE tid = :tid', tid=this.team[t]['id'])
        cost_released, = r.fetchone()
        r = g.dbex('SELECT SUM(contract_amount) * 1000 / 82 FROM player_attributes WHERE tid = :tid', tid=this.team[t]['id'])
        cost, = r.fetchone()
        if (cost_released) {
            cost += cost_released;
        }
    }
    else {*/
                cost = 0
//    }

            teamSeason.cash = teamSeason.cash + g.ticketPrice * that.att - cost;

            keys = ['min', 'fg', 'fga', 'tp', 'tpa', 'ft', 'fta', 'orb', 'drb', 'ast', 'tov', 'stl', 'blk', 'pf', 'pts'];
            for (var i=0; i<keys.length; i++) {
                teamStats[keys[i]] += that.team[t].stat[keys[i]];
            }
            teamStats.gp += 1;
            teamStats.oppPts += that.team[t2].stat.pts;
            teamStats.att += that.att;

            if (won && !this.playoffs) {
                teamSeason.won += 1;
                if (this.same_division) {
                    teamSeason.wonDiv += 1;
                }
                if (this.same_conference) {
                    teamSeason.wonConf += 1;
                }
            }
            else if (!this.playoffs) {
                teamSeason.lost += 1;
                if (this.same_division) {
                    teamSeason.lostDiv += 1;
                }
                if (this.same_conference) {
                    teamSeason.lostConf += 1;
                }
            }

            cursor.update(teamSeason);

            that.teamsRemaining -= 1;
            if (that.playersRemaining == 0 && that.teamsRemaining == 0) {
                that.callback();
            }
        }
    }

    function _composite(minval, maxval, rating, components, inverse, rand) {
        inverse = typeof inverse !== "undefined" ? inverse : false;
        rand = typeof rand !== "undefined" ? rand : true;

        r = 0.0;
        rmax = 0.0;
        if (inverse) {
            sign = -1;
            add = -100;
        }
        else {
            sign = 1;
            add = 0;
        }
        for (var i=0; i<components.length; i++) {
            component = components[i];
            // Sigmoidal transformation
            y = (rating[component] - 70) / 10;
            rcomp = y / Math.sqrt(1 + Math.pow(y, 2));
            rcomp = (rcomp + 1) * 50;
    //        rcomp = rating[component]

            r = r + sign * (add + rcomp);
            rmax = rmax + sign * (add + 100);
        }
        // Scale from minval to maxval
        r = r / (100.0 * components.length);  // 0-1
    //    r = r / (rmax * components.length)  // 0-1
        r = r * (maxval - minval) + minval;  // Min-Max
        // Randomize: Mulitply by a random number from N(1,0.1)
        if (rand) {
            r = random.gauss(1, 0.1) * r;
        }
        return r;
    }

    /*Convenience function to save game stats.*/
    function saveResults(results, playoffs, callback) {
//        r = g.dbex('SELECT in_progress_timestamp FROM schedule WHERE gid = :gid', gid=results['gid'])
//        in_progress_timestamp, = r.fetchone()
//        if (in_progress_timestamp > 0) {
            gm = new Game();
            gm.load(results, playoffs);
            gm.writeStats(callback);
//            g.dbex('DELETE FROM schedule WHERE gid = :gid', gid=results['gid'])
            console.log("Saved results for game " + results['gid']);
//        else {
//            console.log("Ignored stale results for game " + results['gid']);
//        }
    }

    /*Play num_days days worth of games. If start is true, then this is
    starting a new series of games. If not, then it's continuing a simulation.
    */
    function play(num_days, start) {
        start = typeof start !== "undefined" ? start : false;

        teams = [];
        schedule = [];
        playoffs_continue = false;
        url = null;

        // If this is a request to start a new simulation... are we allowed to do
        // that? If so, set the lock and update the play menu
        if (start) {
            if (lock.can_start_games()) {
                lock.set_games_in_progress(true);
                playMenu.refreshOptions();
            }
            else {
                // If not allowed to start games, don't
                return {teams: teams, schedule: schedule, playoffs_continue: playoffs_continue, url: url};
            }
        }

        if (num_days > 0) {
/*            // If the user wants to stop the simulation, then stop the simulation
            r = g.dbex('SELECT stop_games FROM game_attributes WHERE season = :season', season=g.season)
            stop_games, = r.fetchone()
            if (stop_games) {
                g.dbex('UPDATE game_attributes SET stop_games = false WHERE season = :season', season=g.season)
            }*/

            // If we didn't just stop games, let's play
            // Or, if we are starting games (and already passed the lock above),
            // continue even if stop_games was just seen
//            if (start || !stop_games) {
                // Check if it's the playoffs and do some special stuff if it is or isn't
                if (g.phase == c.PHASE_PLAYOFFS) {
                    num_active_teams = season.new_schedule_playoffs_day();

                    // If season.new_schedule_playoffs_day didn't move the phase to 4, then
                    // the playoffs are still happening.
                    if (g.phase == c.PHASE_PLAYOFFS) {
                        playoffs_continue = true;
                    }
                }
                else {
                    num_active_teams = g.num_teams;

                    // Decrease free agent demands and let AI teams sign them
//                    free_agents_decrease_demands();
//                    free_agents_auto_sign();
                }

                playMenu.setStatus("Playing games (" + num_days + " days remaining)...")
                // Create schedule and team lists for today, to be sent to the client
//                schedule = season.get_schedule(num_active_teams / 2);
schedule = [{gid: 6235, home_tid: 15, away_tid: 2},
            {gid: 6235, home_tid: 15, away_tid: 2},
            {gid: 6235, home_tid: 4, away_tid: 2},
            {gid: 6235, home_tid: 15, away_tid: 2},
            {gid: 6235, home_tid: 15, away_tid: 2},
            {gid: 6235, home_tid: 6, away_tid: 2},
            {gid: 6235, home_tid: 15, away_tid: 2},
            {gid: 6235, home_tid: 15, away_tid: 2},
            {gid: 6235, home_tid: 2, away_tid: 2},
            {gid: 6235, home_tid: 15, away_tid: 2},
            {gid: 6235, home_tid: 15, away_tid: 2},
            {gid: 6235, home_tid: 15, away_tid: 2},
            {gid: 6235, home_tid: 15, away_tid: 2},
            {gid: 6235, home_tid: 15, away_tid: 2},
            {gid: 6235, home_tid: 15, away_tid: 2}];
                tids_today = [];
                for (var j=0; j<schedule.length; j++) {
                    matchup = schedule[j];
//                    g.dbex('UPDATE schedule SET in_progress_timestamp = :in_progress_timestamp WHERE gid = :gid', in_progress_timestamp=int(time.time()), gid=game['gid'])
                    tids_today.push(matchup['home_tid']);
                    tids_today.push(matchup['away_tid']);
        //                tids_today = list(set(tids_today))  // Unique list
                }

                teams = [];
                var teams_loaded = 0;
                // Load all teams, for now. Would be more efficient to load only some of them, I suppose.
                for (var tid=0; tid<30; tid++) {
                    g.dbl.transaction(["players"]).objectStore("players").index('tid').getAll(tid).onsuccess = function(event) {
                        var players = event.target.result;
                        var realTid = players[0].tid;
                        var t = {id: realTid, defense: 0, pace: 0, won: 0, lost: 0, cid: 0, did: 0, stat: {}, player: []}
                        g.dbl.transaction(["teams"]).objectStore("teams").index('tid').getAll(realTid).onsuccess = function(event) {
                            var teamSeasons = event.target.result;
                            for (var j=0; j<teamSeasons.length; j++) {
                                if (teamSeasons[j]['season'] == g.season) {
                                    var team = teamSeasons[j];
                                    break;
                                }
                            }
                            t.won = team.won;
                            t.lost = team.lost;
                            t.cid = team.cid;
                            t.did = team.did;

                            for (var i=0; i<players.length; i++) {
                                var player = players[i];
                                var p = {id: player.pid, ovr: 0, stat: {}, composite_rating: {}};

                                for (var j=0; j<player.ratings.length; j++) {
                                    if (player.ratings[j]['season'] == g.season) {
                                        var rating = player.ratings[j];
                                        break;
                                    }
                                }

                                p['ovr'] = rating['ovr'];

                                p['composite_rating']['pace'] = _composite(90, 140, rating, ['spd', 'jmp', 'dnk', 'tp', 'stl', 'drb', 'pss'], undefined, false);
                                p['composite_rating']['shot_ratio'] = _composite(0, 0.5, rating, ['ins', 'dnk', 'fg', 'tp']);
                                p['composite_rating']['assist_ratio'] = _composite(0, 0.5, rating, ['drb', 'pss', 'spd']);
                                p['composite_rating']['turnover_ratio'] = _composite(0, 0.5, rating, ['drb', 'pss', 'spd'], true);
                                p['composite_rating']['field_goal_percentage'] = _composite(0.38, 0.68, rating, ['hgt', 'jmp', 'ins', 'dnk', 'fg', 'tp']);
                                p['composite_rating']['free_throw_percentage'] = _composite(0.65, 0.9, rating, ['ft']);
                                p['composite_rating']['three_pointer_percentage'] = _composite(0, 0.45, rating, ['tp']);
                                p['composite_rating']['rebound_ratio'] = _composite(0, 0.5, rating, ['hgt', 'stre', 'jmp', 'reb']);
                                p['composite_rating']['steal_ratio'] = _composite(0, 0.5, rating, ['spd', 'stl']);
                                p['composite_rating']['block_ratio'] = _composite(0, 0.5, rating, ['hgt', 'jmp', 'blk']);
                                p['composite_rating']['foul_ratio'] = _composite(0, 0.5, rating, ['spd'], true);
                                p['composite_rating']['defense'] = _composite(0, 0.5, rating, ['stre', 'spd']);

                                p['stat'] = {gs: 0, min: 0, fg: 0, fga: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0, court_time: 0, bench_time: 0, energy: 1};

                                t['player'].push(p);
                            }

                            // Number of players to factor into pace and defense rating calculation
                            n_players = t['player'].length;
                            if (n_players > 7) {
                                n_players = 7;
                            }

                            // Would be better if these were scaled by average min played and end
                    //        t['pace'] = sum([t['player'][i]['composite_rating']['pace'] for i in xrange(n_players)]) / 7
                    //        t['defense'] = sum([t['player'][i]['composite_rating']['defense'] for i in xrange(n_players)]) / 7 // 0 to 0.5
                    t['pace'] = 100;
                    t['defense'] = 0.25;
                            t['defense'] /= 4; // This gives the percentage pts subtracted from the other team's normal FG%


                            t['stat'] = {min: 0, fg: 0, fga: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0};
    //console.log(t);
//                            teams[tid] = t;
                            teams.push(t);
                            teams_loaded += 1;
                            if (teams_loaded == 30) {
                                teams.sort(function(a, b) {  return a.id - b.id; }); // Order teams by tid

                                // Play games
                                if ((schedule && schedule.length > 0) || playoffs_continue) {
                                    var gamesRemaining = schedule.length;
                                    for (var i=0; i<schedule.length; i++) {
                                        gs = new gameSim.GameSim(schedule[i]['gid'], teams[schedule[i]['home_tid']], teams[schedule[i]['away_tid']]);
                                        var results = gs.run();
                                        saveResults(results, g.phase == c.PHASE_PLAYOFFS, function() {
                                            gamesRemaining -= 1;
                                            if (gamesRemaining == 0) {
                                                play(num_days - 1);
                                            }
                                        });
                                    }
                                }
                            }
                        };
                    };

                    // Only send team data for today's active teams
/*                    if (tids_today.indexOf(tid) >= 0) {
console.log(tid);
                        teams.push(team(tid))
                    }
                    else {
                        teams.push({'id': tid})
                    }*/
                }
//            }
        }
        // If this is the last day, update play menu
        else if (num_days == 0 || (schedule.length == 0 && !playoffs_continue)) {
            playMenu.setStatus('Idle');
            lock.set_games_in_progress(false);
            playMenu.refreshOptions();
            // Check to see if the season is over
/*            r = g.dbex('SELECT gid FROM schedule LIMIT 1')
            if (r.rowcount == 0 && g.phase < c.PHASE_PLAYOFFS) {
                season.new_phase(c.PHASE_PLAYOFFS);  // Start playoffs
                url = "/l/" + g.lid + "/history";
            }*/
        }
//        return {teams: teams, schedule: schedule, playoffs_continue: playoffs_continue, url: url};
    }

    return {
        play: play
    }
});
