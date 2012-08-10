/**
 * @name core.game
 * @namespace Everything about games except the actual simulation. So, loading the schedule, loading the teams, saving the results, and handling multi-day simulations and what happens when there are no games left to play.
 */
define(["db", "core/freeAgents", "core/gameSim", "core/season", "util/helpers", "util/lock", "util/playMenu", "util/random"], function (db, freeAgents, gameSim, season, helpers, lock, playMenu, random) {
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

        // What is the attendance of the game?
        winp = 0;
        gp = this.team[0].won + this.team[0].lost + this.team[1].won + this.team[1].lost;
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

        // Player stats and team stats
        that = this;
        playerStore = this.transaction.objectStore("players");
        for (t = 0; t < 2; t++) {
            this.writeTeamStats(t);
            for (p = 0; p < this.team[t].player.length; p++) {
                playerStore.openCursor(this.team[t].player[p].id).onsuccess = function (event) {
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
                    if (p < 5) {
                        playerStats.gs += 1;
                    }
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
        var cost, t2, that;

        if (t === 0) {
            t2 = 1;
        } else {
            t2 = 0;
        }
        that = this;

        // Record progress of playoff series, if appropriate
        if (this.playoffs && t === 0) {
            this.transaction.objectStore("playoffSeries").openCursor(g.season).onsuccess = function (event) {
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

        // Only pay player salaries for regular season games.
        cost = 0;
        if (!that.playoffs) {
            db.getPayroll(that.transaction, that.team[t].id, function (payroll) {
                cost = payroll / 82;
            });
        }

        // Team stats
        this.transaction.objectStore("teams").openCursor(that.team[t].id).onsuccess = function (event) {
            var cursor, i, keys, team, teamSeason, teamStats, won;

            cursor = event.target.result;
            team = cursor.value;
            for (i = 0; i < team.seasons.length; i++) {
                if (team.seasons[i].season === g.season) {
                    teamSeason = team.seasons[i];
                    break;
                }
            }
            for (i = 0; i < team.stats.length; i++) {
                if (team.stats[i].season === g.season && team.stats[i].playoffs === that.playoffs) {
                    teamStats = team.stats[i];
                    break;
                }
            }

            if (that.team[t].stat.pts > that.team[t2].stat.pts) {
                won = true;
            } else {
                won = false;
            }

            teamSeason.cash = teamSeason.cash + g.ticketPrice * that.att - 1000 * cost;
            teamSeason.att += that.att;
            teamSeason.gp += 1;
            teamSeason.cost += 1000 * cost;

            keys = ['min', 'fg', 'fga', 'tp', 'tpa', 'ft', 'fta', 'orb', 'drb', 'ast', 'tov', 'stl', 'blk', 'pf', 'pts'];
            for (i = 0; i < keys.length; i++) {
                teamStats[keys[i]] += that.team[t].stat[keys[i]];
            }
            teamStats.gp += 1;
            teamStats.trb += that.team[t].stat.orb + that.team[t].stat.drb;
            teamStats.oppPts += that.team[t2].stat.pts;

            if (won && !that.playoffs) {
                teamSeason.won += 1;
                if (that.same_division) {
                    teamSeason.wonDiv += 1;
                }
                if (that.same_conference) {
                    teamSeason.wonConf += 1;
                }
            } else if (!that.playoffs) {
                teamSeason.lost += 1;
                if (that.same_division) {
                    teamSeason.lostDiv += 1;
                }
                if (that.same_conference) {
                    teamSeason.lostConf += 1;
                }
            }

            cursor.update(team);

            that.teamsRemaining -= 1;
            if (that.playersRemaining === 0 && that.teamsRemaining === 0) {
                that.cb();
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
                if (p < 5) {
                    gameStats.teams[t].players[p].gs = 1;
                } else {
                    gameStats.teams[t].players[p].gs = 0;
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
        this.transaction.objectStore("teams").get(this.team[tw].id).onsuccess = function (event) {
            var team;

            team = event.target.result;
            gameStats.won.abbrev = team.abbrev;
            gameStats.won.region = team.region;
            gameStats.won.name = team.name;
            gameStats.teams[tw].abbrev = team.abbrev;
            gameStats.teams[tw].region = team.region;
            gameStats.teams[tw].name = team.name;
        };
        this.transaction.objectStore("teams").get(this.team[tl].id).onsuccess = function (event) {
            var team;

            team = event.target.result;
            gameStats.lost.abbrev = team.abbrev;
            gameStats.lost.region = team.region;
            gameStats.lost.name = team.name;
            gameStats.teams[tl].abbrev = team.abbrev;
            gameStats.teams[tl].region = team.region;
            gameStats.teams[tl].name = team.name;

            gameStats.won.pts = that.team[tw].stat.pts;
            gameStats.lost.pts = that.team[tl].stat.pts;

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

    /**
     * Load all teams into an array of team objects.
     * 
     * The team objects contain all the information needed to simulate games.
     * 
     * @memberOf core.game
     * @param {IDBTransaction} transaction A readwrite IndexedDB transaction on games, players, playoffSeries, releasedPlayers, schedule, and teams.
     * @param {function(Array)} cb Callback function that takes the array of team objects as its only argument.
     */
    function loadTeams(transaction, cb) {
        var teams, tid;

        teams = [];

        for (tid = 0; tid < 30; tid++) {
            transaction.objectStore("players").index("tid").getAll(tid).onsuccess = function (event) {
                var players, realTid, t;

                players = event.target.result;
                players.sort(function (a, b) {  return a.rosterOrder - b.rosterOrder; });
                realTid = players[0].tid;
                t = {id: realTid, defense: 0, pace: 0, won: 0, lost: 0, cid: 0, did: 0, stat: {}, player: []};
                transaction.objectStore("teams").get(realTid).onsuccess = function (event) {
                    var i, j, n_players, p, player, rating, team, teamSeason;

                    team = event.target.result;
                    for (j = 0; j < team.seasons.length; j++) {
                        if (team.seasons[j].season === g.season) {
                            teamSeason = team.seasons[j];
                            break;
                        }
                    }
                    t.won = teamSeason.won;
                    t.lost = teamSeason.lost;
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
                    t.pace = 0;
                    for (i = 0; i < n_players; i++) {
                        t.pace += t.player[i].composite_rating.pace;
                    }
                    t.pace /= n_players;
                    t.defense = 0;
                    for (i = 0; i < n_players; i++) {
                        t.defense += t.player[i].composite_rating.defense;
                    }
                    t.defense /= n_players;
                    t.defense /= 4;  // This gives the percentage pts subtracted from the other team's normal FG%


                    t.stat = {min: 0, fg: 0, fga: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0};
                    teams.push(t);
                    if (teams.length === 30) {
                        cb(teams);
                    }
                };
            };
        }
    }

    /*Play numDays days worth of games. If start is true, then this is
    starting a new series of games. If not, then it's continuing a simulation.
    */
    function play(numDays, start) {
        var cbNoGames, cbPlayGames, playoffsContinue;

        start = typeof start !== "undefined" ? start : false;

        // This is called when there are no more games to play, either at the end of the regular season or the end of the playoffs.
        cbNoGames = function () {
            playMenu.setStatus('Idle');
            lock.set_games_in_progress(false);
            playMenu.refreshOptions();
            // Check to see if the season is over
            if (g.phase < c.PHASE_PLAYOFFS) {
                season.getSchedule(0, function (schedule) {
                    if (schedule.length === 0) {
                        season.newPhase(c.PHASE_PLAYOFFS);
                    }
                });
            }
        };

        // Simulates a day of games. If there are no games left, it calls cbNoGames.
        cbPlayGames = function () {
            playMenu.setStatus("Playing games (" + numDays + " days remaining)...");
            // Create schedule and team lists for today, to be sent to the client
            season.getSchedule(1, function (schedule) {
                var tid, transaction;

                // This transaction is used for a day's simulations, first reading data from it and then writing the game results
                transaction = g.dbl.transaction(["games", "players", "playoffSeries", "releasedPlayers", "schedule", "teams"], "readwrite");

                // Load all teams, for now. Would be more efficient to load only some of them, I suppose.
                loadTeams(transaction, function (teams) {
                    var doGameSim, doSaveResults, gamesRemaining, gidsFinished;

                    teams.sort(function (a, b) {  return a.id - b.id; });  // Order teams by tid

                    // Play games
                    if ((schedule && schedule.length > 0) || playoffsContinue) {
                        gamesRemaining = schedule.length;
                        gidsFinished = [];
                        doGameSim = function (i) {
                            var gs, results;

                            if (i < schedule.length) {
                                gs = new gameSim.GameSim(schedule[i].gid, teams[schedule[i].homeTid], teams[schedule[i].awayTid]);
                                results = gs.run();
                                doSaveResults(i, results, g.phase === c.PHASE_PLAYOFFS);
                            }
                        };
                        doSaveResults = function (i, results, playoffs) {
                            var gm;

                            gm = new Game();
                            gm.load(results, playoffs);
                            gm.writeStats(transaction, function () {
                                var j, scheduleStore;

                                gamesRemaining -= 1;
                                gidsFinished.push(results.gid);
                                if (gamesRemaining === 0) {
                                    scheduleStore = transaction.objectStore("schedule");
                                    for (j = 0; j < gidsFinished.length; j++) {
                                        scheduleStore.delete(gidsFinished[j]);
                                    }

                                    play(numDays - 1);
                                } else {
                                    doGameSim(i + 1);
                                }
                            });
                        };
                        doGameSim(0); // Will loop through schedule and simulate all games
                        if (schedule.length === 0 && playoffsContinue) {
                            play(numDays - 1);
                        }
                    }
                });
                if (schedule.length === 0 && !playoffsContinue) {
                    cbNoGames();
                }
            });
        };

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

        if (numDays > 0) {
            // If we didn't just stop games, let's play
            // Or, if we are starting games (and already passed the lock above),
            // continue even if stop_games was just seen
            if (start || !g.stopGames) {
                if (g.stopGames) {
                    helpers.setGameAttributes({stopGames: false});
                }
                // Check if it's the playoffs and do some special stuff if it is or isn't
                if (g.phase !== c.PHASE_PLAYOFFS) {
                    // Decrease free agent demands and let AI teams sign them
                    freeAgents.decreaseDemands(function () {
                        freeAgents.autoSign(function () {
                            cbPlayGames();
                        });
                    });
                } else {
                    season.newSchedulePlayoffsDay(function (playoffsOver) {
                        // If season.newSchedulePlayoffsDay didn't move the phase to 4, then
                        // the playoffs are still happening.
                        if (g.phase === c.PHASE_PLAYOFFS) {
                            playoffsContinue = true;
                        }
                        cbPlayGames();
                    });
                }
            }
        }
        // If this is the last day, update play menu
        if (numDays === 0) {
            cbNoGames();
        }
    }

    return {
        play: play
    };
});