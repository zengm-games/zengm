define(["core/gameSim", "core/season", "util/helpers", "util/lock", "util/playMenu", "util/random"], function (gameSim, season, helpers, lock, playMenu, random) {
    "use strict";

    function Game() {
    }

    Game.prototype.load = function (results, playoffs) {
        var cid, did, gp, winp;

        // Retrieve stats
        this.team = results.team;
        this.playoffs = playoffs;
        this.id = results.gid;
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
        } else {
            this.att = random.gauss(winp * 36000, 1000);
        }
        if (this.att > 25000) {
            this.att = 25000;
        } else if (this.att < 10000) {
            this.att = 10000;
        }

        // Are the teams in the same conference/division?
        this.same_conference = false;
        this.same_division = false;
        cid = [-1, -1];
        did = [-1, -1];
        if (this.team[0].cid === this.team[1].cid) {
            this.same_conference = true;
        }
        if (this.team[0].did === this.team[1].did) {
            this.same_division = true;
        }
    };

    Game.prototype.writeStats = function (transaction, cb) {
        var i, p, playerStore, t, that;
        this.teamsRemaining = 2;
        this.playersRemaining = this.team[0].player.length + this.team[1].player.length;
        this.cb = cb;

        this.transaction = transaction;
        // Record who the starters are
/*    t = 0; t < 2; t++) {
        r = g.dbex('SELECT pid FROM player_attributes WHERE tid = :tid ORDER BY roster_order ASC LIMIT 5', tid=this.team[t]['id'])
        for starter_id, in r.fetchall() {
            for (p=0; p<this.team[t]['player'].length; p++) {
                if (this.team[t]['player'][p]['id'] === starter_id) {
                    this.team[t]['player'][p]['stat']['gs'] = 1;
                }
            }
        }
    }*/

        // Player stats and team stats
        that = this;
        playerStore = this.transaction.objectStore("players");
        for (t = 0; t < 2; t++) {
            this.writeTeamStats(t);
            for (p = 0; p < this.team[t].player.length; p++) {
                playerStore.openCursor(IDBKeyRange.only(this.team[t].player[p].id)).onsuccess = function (event) {
                    var cursor, keys, p, player, playerStats, t;
                    cursor = event.target.result;
                    player = cursor.value;

                    // Find the correct row of stats
                    for (i = 0; i < player.stats.length; i++) {
                        if (player.stats[i].season === g.season && player.stats[i].playoffs === that.playoffs) {
                            playerStats = player.stats[i];
                            break;
                        }
                    }

                    // Which team is this, again?
                    if (player.tid === that.team[0].id) {
                        t = 0;
                    } else {
                        t = 1;
                    }

                    // Which player is this, again?
                    for (p = 0; p < that.team[t].player.length; p++) {
                        if (player.pid === that.team[t].player[p].id) {
                            break;
                        }
                    }

                    // Update stats
                    keys = ['min', 'fg', 'fga', 'tp', 'tpa', 'ft', 'fta', 'orb', 'drb', 'ast', 'tov', 'stl', 'blk', 'pf', 'pts'];
                    for (i = 0; i < keys.length; i++) {
                        playerStats[keys[i]] += that.team[t].player[p].stat[keys[i]];
                    }
                    playerStats.gp += 1;
                    playerStats.trb += that.team[t].player[p].stat.orb + that.team[t].player[p].stat.drb;

                    cursor.update(player);

                    that.playersRemaining -= 1;
                    if (that.playersRemaining === 0 && that.teamsRemaining === 0) {
                        that.cb();
                    }
                };
            }
        }
        that.writeGameStats();
    };

    Game.prototype.writeTeamStats = function (t) {
        var t2, that;

        if (t === 0) {
            t2 = 1;
        } else {
            t2 = 0;
        }
        that = this;

        // Record progress of playoff series, if appropriate
        if (this.playoffs && t === 0) {
            this.transaction.objectStore("playoffSeries").openCursor(IDBKeyRange.only(g.season)).onsuccess = function (event) {
                var cursor, i, playoffRound, playoffSeries, series, won0;

                cursor = event.target.result;
                playoffSeries = cursor.value;
                playoffRound = playoffSeries.series[playoffSeries.currentRound];

                // Did the home (true) or away (false) team win this game? Here, "home" refers to this game, not the team which has homecourt advnatage in the playoffs, which is what series.home refers to below.
                if (that.team[t].stat.pts > that.team[t2].stat.pts) {
                    won0 = true;
                } else {
                    won0 = false;
                }

                for (i = 0; i < playoffRound.length; i++) {
                    series = playoffRound[i];

                    if (series.home.tid === that.team[t].id) {
                        if (won0) {
                            series.home.won += 1;
                        } else {
                            series.away.won += 1;
                        }
                    } else if (series.away.tid === that.team[t].id) {
                        if (won0) {
                            series.away.won += 1;
                        } else {
                            series.home.won += 1;
                        }
                    }
                }

                cursor.update(playoffSeries);
            };
        }

        // Team stats
        this.transaction.objectStore("teams").index("tid").openCursor(IDBKeyRange.only(that.team[t].id)).onsuccess = function (event) {
            var cost, cursor, i, keys, teamSeason, teamStats, won;

            cursor = event.target.result;
            teamSeason = cursor.value;
            if (teamSeason.season === g.season) {
                teamStats = teamSeason.stats[0];
                if (teamStats.playoffs !== that.playoffs) {
                    teamStats = teamSeason.stats[1];
                }

                if (that.team[t].stat.pts > that.team[t2].stat.pts) {
                    won = true;
                } else {
                    won = false;
                }

                // Only pay player salaries for regular season games.
    /*    if (!that.playoffs) {
            r = g.dbex('SELECT SUM(contract_amount) * 1000 / 82 FROM released_players_salaries WHERE tid = :tid', tid=this.team[t]['id'])
            cost_released, = r.fetchone()
            r = g.dbex('SELECT SUM(contract_amount) * 1000 / 82 FROM player_attributes WHERE tid = :tid', tid=this.team[t]['id'])
            cost, = r.fetchone()
            if (cost_released) {
                cost += cost_released;
            }
        }
        else {*/
                    cost = 0;
    //    }

                teamSeason.cash = teamSeason.cash + g.ticketPrice * that.att - cost;

                keys = ['min', 'fg', 'fga', 'tp', 'tpa', 'ft', 'fta', 'orb', 'drb', 'ast', 'tov', 'stl', 'blk', 'pf', 'pts'];
                for (i = 0; i < keys.length; i++) {
                    teamStats[keys[i]] += that.team[t].stat[keys[i]];
                }
                teamStats.gp += 1;
                teamStats.trb += that.team[t].stat.orb + that.team[t].stat.drb;
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
                } else if (!this.playoffs) {
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
                if (that.playersRemaining === 0 && that.teamsRemaining === 0) {
                    that.cb();
                }
            } else {
                cursor.continue();
            }
        };
    };

    Game.prototype.writeGameStats = function () {
        var gameStats, i, keys, p, t, that, tl, tw;

        gameStats = {gid: this.id, season: g.season, playoffs: this.playoffs, won: {}, lost: {}, teams: [{tid: this.team[0].id, players: []}, {tid: this.team[1].id, players: []}]};
        for (t = 0; t < 2; t++) {
            keys = ['min', 'fg', 'fga', 'tp', 'tpa', 'ft', 'fta', 'orb', 'drb', 'ast', 'tov', 'stl', 'blk', 'pf', 'pts'];
            for (i = 0; i < keys.length; i++) {
                gameStats.teams[t][keys[i]] = this.team[t].stat[keys[i]];
            }
            gameStats.teams[t].trb = this.team[t].stat.orb + this.team[t].stat.drb;

            for (p = 0; p < this.team[t].player.length; p++) {
                gameStats.teams[t].players[p] = {name: this.team[t].player[p].name, pos: this.team[t].player[p].pos};
                for (i = 0; i < keys.length; i++) {
                    gameStats.teams[t].players[p][keys[i]] = this.team[t].player[p].stat[keys[i]];
                }
                gameStats.teams[t].players[p].trb = this.team[t].player[p].stat.orb + this.team[t].player[p].stat.drb;
                gameStats.teams[t].players[p].pid = this.team[t].player[p].id;
            }
        }


        // Store some extra junk to make box scores easy
        if (this.team[0].stat.pts > this.team[1].stat.pts) {
            tw = 0;
            tl = 1;
        } else {
            tw = 1;
            tl = 0;
        }

        that = this;
        this.transaction.objectStore("teams").index("season").getAll(g.season).onsuccess = function (event) {
            var i, team, teams;

            teams = event.target.result;
            for (i = 0; i < teams.length; i++) {
                team = teams[i];
                if (team.tid === that.team[tw].id) {
                    gameStats.won.abbrev = team.abbrev;
                    gameStats.won.region = team.region;
                    gameStats.won.name = team.name;
                    gameStats.teams[tw].abbrev = team.abbrev;
                    gameStats.teams[tw].region = team.region;
                    gameStats.teams[tw].name = team.name;

                } else if (team.tid === that.team[tl].id) {
                    gameStats.lost.abbrev = team.abbrev;
                    gameStats.lost.region = team.region;
                    gameStats.lost.name = team.name;
                    gameStats.teams[tl].abbrev = team.abbrev;
                    gameStats.teams[tl].region = team.region;
                    gameStats.teams[tl].name = team.name;
                }
                gameStats.won.pts = that.team[tw].stat.pts;
                gameStats.lost.pts = that.team[tl].stat.pts;
            }
            this.transaction.objectStore("games").add(gameStats);
        };
    };

    function _composite(minval, maxval, rating, components, inverse, rand) {
        var add, component, i, r, rcomp, rmax, sign, y;

        inverse = typeof inverse !== "undefined" ? inverse : false;
        rand = typeof rand !== "undefined" ? rand : true;

        r = 0.0;
        rmax = 0.0;
        if (inverse) {
            sign = -1;
            add = -100;
        } else {
            sign = 1;
            add = 0;
        }
        for (i = 0; i < components.length; i++) {
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
    function saveResults(transaction, results, playoffs, cb) {
        var gm;
//        r = g.dbex('SELECT in_progress_timestamp FROM schedule WHERE gid = :gid', gid=results['gid'])
//        in_progress_timestamp, = r.fetchone()
//        if (in_progress_timestamp > 0) {
            gm = new Game();
            gm.load(results, playoffs);
            gm.writeStats(transaction, cb);
            console.log("Saved results for game " + results.gid);
//        else {
//            console.log("Ignored stale results for game " + results['gid']);
//        }
    }

    /*Play num_days days worth of games. If start is true, then this is
    starting a new series of games. If not, then it's continuing a simulation.
    */
    function play(num_days, start) {
        var num_active_teams, playoffsContinue;

        start = typeof start !== "undefined" ? start : false;

        function cbNoGames() {
            playMenu.setStatus('Idle');
            lock.set_games_in_progress(false);
            playMenu.refreshOptions();
            // Check to see if the season is over
            if (g.phase < c.PHASE_PLAYOFFS) {
                season.getSchedule(0, function (schedule) {
                    if (schedule.length === 0) {
                        season.newPhase(c.PHASE_PLAYOFFS);
// MOVE THIS TO newPhase(c.PHASE_PLAYOFFS)
//                url = "/l/" + g.lid + "/history";
                    }
                });
            }
        }

        function cbPlayGames() {
            playMenu.setStatus("Playing games (" + num_days + " days remaining)...");
            // Create schedule and team lists for today, to be sent to the client
            season.getSchedule(num_active_teams / 2, function (schedule) {
                var j, matchup, teams, teams_loaded, tid, transaction;

//                    tids_today = [];
                for (j = 0; j < schedule.length; j++) {
                    matchup = schedule[j];
//                        g.dbex('UPDATE schedule SET in_progress_timestamp = :in_progress_timestamp WHERE gid = :gid', in_progress_timestamp=int(time.time()), gid=game['gid'])
//                        tids_today.push(matchup.homeTid);
//                        tids_today.push(matchup.awayTid);
//                        tids_today = list(set(tids_today))  // Unique list
                }

                transaction = g.dbl.transaction(["games", "players", "playoffSeries", "schedule", "teams"], IDBTransaction.READ_WRITE);

                teams = [];
                teams_loaded = 0;
                // Load all teams, for now. Would be more efficient to load only some of them, I suppose.
                for (tid = 0; tid < 30; tid++) {
                    transaction.objectStore("players").index("tid").getAll(tid).onsuccess = function (event) {
                        var players, realTid, t;

                        players = event.target.result;
                        realTid = players[0].tid;
                        t = {id: realTid, defense: 0, pace: 0, won: 0, lost: 0, cid: 0, did: 0, stat: {}, player: []};
                        transaction.objectStore("teams").index("tid").getAll(realTid).onsuccess = function (event) {
                            var doSaveResults, gamesRemaining, gidsFinished, gs, i, j, n_players, p, player, rating, results, team, teamSeasons;

                            teamSeasons = event.target.result;
                            for (j = 0; j < teamSeasons.length; j++) {
                                if (teamSeasons[j].season === g.season) {
                                    team = teamSeasons[j];
                                    break;
                                }
                            }
                            t.won = team.won;
                            t.lost = team.lost;
                            t.cid = team.cid;
                            t.did = team.did;

                            for (i = 0; i < players.length; i++) {
                                player = players[i];
                                p = {id: player.pid, name: player.name, pos: player.pos, ovr: 0, stat: {}, composite_rating: {}};

                                for (j = 0; j < player.ratings.length; j++) {
                                    if (player.ratings[j].season === g.season) {
                                        rating = player.ratings[j];
                                        break;
                                    }
                                }

                                p.ovr = rating.ovr;

                                p.composite_rating.pace = _composite(90, 140, rating, ['spd', 'jmp', 'dnk', 'tp', 'stl', 'drb', 'pss'], undefined, false);
                                p.composite_rating.shot_ratio = _composite(0, 0.5, rating, ['ins', 'dnk', 'fg', 'tp']);
                                p.composite_rating.assist_ratio = _composite(0, 0.5, rating, ['drb', 'pss', 'spd']);
                                p.composite_rating.turnover_ratio = _composite(0, 0.5, rating, ['drb', 'pss', 'spd'], true);
                                p.composite_rating.field_goal_percentage = _composite(0.38, 0.68, rating, ['hgt', 'jmp', 'ins', 'dnk', 'fg', 'tp']);
                                p.composite_rating.free_throw_percentage = _composite(0.65, 0.9, rating, ['ft']);
                                p.composite_rating.three_pointer_percentage = _composite(0, 0.45, rating, ['tp']);
                                p.composite_rating.rebound_ratio = _composite(0, 0.5, rating, ['hgt', 'stre', 'jmp', 'reb']);
                                p.composite_rating.steal_ratio = _composite(0, 0.5, rating, ['spd', 'stl']);
                                p.composite_rating.block_ratio = _composite(0, 0.5, rating, ['hgt', 'jmp', 'blk']);
                                p.composite_rating.foul_ratio = _composite(0, 0.5, rating, ['spd'], true);
                                p.composite_rating.defense = _composite(0, 0.5, rating, ['stre', 'spd']);

                                p.stat = {gs: 0, min: 0, fg: 0, fga: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0, court_time: 0, bench_time: 0, energy: 1};

                                t.player.push(p);
                            }

                            // Number of players to factor into pace and defense rating calculation
                            n_players = t.player.length;
                            if (n_players > 7) {
                                n_players = 7;
                            }

                            // Would be better if these were scaled by average min played and end
//                                t.pace = sum([t['player'][i].composite_rating.pace for i in xrange(n_players)]) / 7
//                                t.defense. = sum([t['player'][i].composite_rating.defense for i in xrange(n_players)]) / 7 // 0 to 0.5
t.pace = 100;
t.defense = 0.25;
                            t.defense /= 4; // This gives the percentage pts subtracted from the other team's normal FG%


                            t.stat = {min: 0, fg: 0, fga: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0};
    //console.log(t);
//                            teams[tid] = t;
                            teams.push(t);
                            teams_loaded += 1;
                            if (teams_loaded === 30) {
                                teams.sort(function (a, b) {  return a.id - b.id; }); // Order teams by tid

                                // Play games
                                if ((schedule && schedule.length > 0) || playoffsContinue) {
                                    gamesRemaining = schedule.length;
                                    gidsFinished = [];
                                    doSaveResults = function (results, playoffs) {
                                        var i, scheduleStore;
                                        saveResults(transaction, results, playoffs, function () {
                                            gamesRemaining -= 1;
                                            gidsFinished.push(results.gid);
                                            if (gamesRemaining === 0) {
                                                scheduleStore = transaction.objectStore("schedule");
                                                for (i = 0; i < gidsFinished.length; i++) {
                                                    scheduleStore.delete(gidsFinished[i]);
                                                }

                                                play(num_days - 1);
                                            }
                                        });
                                    };
                                    for (i = 0; i < schedule.length; i++) {
                                        gs = new gameSim.GameSim(schedule[i].gid, teams[schedule[i].homeTid], teams[schedule[i].awayTid]);
                                        results = gs.run();
                                        doSaveResults(results, g.phase === c.PHASE_PLAYOFFS);
                                    }
                                    if (schedule.length === 0 && playoffsContinue) {
                                        play(num_days - 1);
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
                if (schedule.length === 0 && !playoffsContinue) {
                    cbNoGames();
                }
            });
        }

        playoffsContinue = false;

        // If this is a request to start a new simulation... are we allowed to do
        // that? If so, set the lock and update the play menu
        if (start) {
            if (lock.can_start_games()) {
                lock.set_games_in_progress(true);
                playMenu.refreshOptions();
            } else {
                // If not allowed to start games, don't
                return;
            }
        }

        if (num_days > 0) {
            // If we didn't just stop games, let's play
            // Or, if we are starting games (and already passed the lock above),
            // continue even if stop_games was just seen
            if (start || !g.stopGames) {
                if (g.stopGames) {
                    helpers.setGameAttributes({stopGames: false});
                }
                // Check if it's the playoffs and do some special stuff if it is or isn't
                if (g.phase !== c.PHASE_PLAYOFFS) {
                    num_active_teams = g.numTeams;

                    // Decrease free agent demands and let AI teams sign them
//                    free_agents_decrease_demands();
//                    free_agents_auto_sign();

                    cbPlayGames();
                } else {
                    season.newSchedulePlayoffsDay(function (num_active_teams, playoffsOver) {
                        // If season.newSchedulePlayoffsDay didn't move the phase to 4, then
                        // the playoffs are still happening.
                        if (!playoffsOver) {
                            playoffsContinue = true;
                        }
                        cbPlayGames();
                    });
                }
            }
        }
        // If this is the last day, update play menu
        if (num_days === 0) {
            cbNoGames();
        }
    }

    return {
        play: play
    };
});