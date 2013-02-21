/**
 * @name core.game
 * @namespace Everything about games except the actual simulation. So, loading the schedule, loading the teams, saving the results, and handling multi-day simulations and what happens when there are no games left to play.
 */
define(["db", "ui", "core/advStats", "core/freeAgents", "core/gameSim", "core/season", "util/lock", "util/random"], function (db, ui, advStats, freeAgents, gameSim, season, lock, random) {
    "use strict";

    function Game() {
    }

    Game.prototype.load = function (results, playoffs) {
        var cid, did, gp, winp;

        // Retrieve stats
        this.team = results.team;
        this.playoffs = playoffs;
        this.id = results.gid;
        this.overtimes = results.overtimes;
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
        this.sameConf = false;
        this.sameDiv = false;
        cid = [-1, -1];
        did = [-1, -1];
        if (this.team[0].cid === this.team[1].cid) {
            this.sameConf = true;
        }
        if (this.team[0].did === this.team[1].did) {
            this.sameDiv = true;
        }
    };

    Game.prototype.writeStats = function (transaction, cb) {
        var p, t;

        this.teamsRemaining = 2;
        this.playersRemaining = this.team[0].player.length + this.team[1].player.length;
        this.cb = cb;
        this.transaction = transaction;

        for (t = 0; t < 2; t++) {
            this.writeTeamStats(t);
            for (p = 0; p < this.team[t].player.length; p++) {
                this.writePlayerStats(t, p);
            }
        }
        this.writeGameStats();
    };

    Game.prototype.writePlayerStats = function(t, p) {
        var that;

        that = this;

        this.transaction.objectStore("players").openCursor(that.team[t].player[p].id).onsuccess = function (event) {
            var cursor, i, keys, player, playerStats;

            cursor = event.target.result;
            player = cursor.value;

            // Find the correct row of stats
            for (i = 0; i < player.stats.length; i++) {
                if (player.stats[i].season === g.season && player.stats[i].playoffs === that.playoffs) {
                    playerStats = player.stats[i];
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

        db.getPayroll(this.transaction, that.team[t].id, function (payroll) {
            var cost, revenue;

            // Only pay player salaries for regular season games.
            cost = 0;
            if (!that.playoffs) {
                cost = payroll / 82;  // [thousands of dollars]
            }

            revenue = g.ticketPrice * that.att / 1000;  // [thousands of dollars]

            // Team stats
            that.transaction.objectStore("teams").openCursor(that.team[t].id).onsuccess = function (event) {
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

                teamSeason.cash = teamSeason.cash + revenue - cost;
                teamSeason.att += that.att;
                teamSeason.gp += 1;
                teamSeason.revenue += revenue;
                teamSeason.cost += cost;

                keys = ['min', 'fg', 'fga', 'tp', 'tpa', 'ft', 'fta', 'orb', 'drb', 'ast', 'tov', 'stl', 'blk', 'pf', 'pts'];
                for (i = 0; i < keys.length; i++) {
                    teamStats[keys[i]] += that.team[t].stat[keys[i]];
                }
                teamStats.gp += 1;
                teamStats.trb += that.team[t].stat.orb + that.team[t].stat.drb;
                teamStats.oppPts += that.team[t2].stat.pts;

                if (teamSeason.lastTen.length === 10) {
                    teamSeason.lastTen.pop();
                }
                if (won && !that.playoffs) {
                    teamSeason.won += 1;
                    if (that.sameDiv) {
                        teamSeason.wonDiv += 1;
                    }
                    if (that.sameConf) {
                        teamSeason.wonConf += 1;
                    }

                    if (t === 0) {
                        teamSeason.wonHome += 1;
                    } else {
                        teamSeason.wonAway += 1;
                    }

                    teamSeason.lastTen.unshift(1);

                    if (teamSeason.streak >= 0) {
                        teamSeason.streak += 1;
                    } else {
                        teamSeason.streak = 1;
                    }
                } else if (!that.playoffs) {
                    teamSeason.lost += 1;
                    if (that.sameDiv) {
                        teamSeason.lostDiv += 1;
                    }
                    if (that.sameConf) {
                        teamSeason.lostConf += 1;
                    }

                    if (t === 0) {
                        teamSeason.lostHome += 1;
                    } else {
                        teamSeason.lostAway += 1;
                    }

                    teamSeason.lastTen.unshift(0);

                    if (teamSeason.streak <= 0) {
                        teamSeason.streak -= 1;
                    } else {
                        teamSeason.streak = -1;
                    }
                }

                cursor.update(team);

                that.teamsRemaining -= 1;
                if (that.playersRemaining === 0 && that.teamsRemaining === 0) {
                    that.cb();
                }
            };
        });
    };

    Game.prototype.writeGameStats = function () {
        var gameStats, i, keys, p, t, that, tl, tw;

        gameStats = {gid: this.id, season: g.season, playoffs: this.playoffs, overtimes: this.overtimes, won: {}, lost: {}, teams: [{tid: this.team[0].id, players: []}, {tid: this.team[1].id, players: []}]};
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

    /**
     * Build a composite rating.
     *
     * Composite ratings are combinations of player ratings meant to represent one facet of the game, like the ability to make a jump shot. All composite ratings are scaled from 0 to 1.
     * 
     * @memberOf core.game
     * @param {Object.<string, number>} ratings Player's ratings object.
     * @param {Array.<string>} components List of player ratings to include in the composite ratings
     * @param {Array.<number>=} weights Optional array of weights used in the linear combination of components. If undefined, then all weights are assumed to be 1. If defined, this must be the same size as components.
     * @param {number=} power Power that the composite rating is raised to after the components are linearly combined by  the weights and scaled from 0 to 1. This can be used to introduce nonlinearities, like making a certain stat more uniform (power < 1) or more unevenly distributed (power > 1) or making a composite rating an inverse (power = -1). Default value is 1.
     * @return {number} Composite rating, a number between 0 and 1.
     */
    function _composite(rating, components, weights, power) {
        var add, component, i, r, rcomp, rmax, sign, y;

        power = power !== undefined ? power : 1;
        if (weights === undefined) {
            // Default: array of ones with same size as components
            weights = [];
            for (i = 0; i < components.length; i++) {
                weights.push(1);
            }
        }

        r = 0;
        rmax = 0;
        for (i = 0; i < components.length; i++) {
            component = components[i];
            // Sigmoidal transformation
            //y = (rating[component] - 70) / 10;
            //rcomp = y / Math.sqrt(1 + Math.pow(y, 2));
            //rcomp = (rcomp + 1) * 50;
            rcomp = weights[i] * rating[component];

            r = r + rcomp;
        }
        
        r = r / (100.0 * components.length);  // Scale from 0 to 1
        r = Math.pow(r, power);

        return r;
    }

    /**
     * Load all teams into an array of team objects.
     * 
     * The team objects contain all the information needed to simulate games. It would be more efficient if it only loaded team data for teams that are actually playing, particularly in the playoffs.
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
                    var i, j, numPlayers, p, player, rating, team, teamSeason;

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
                        p = {id: player.pid, name: player.name, pos: player.pos, ovr: 0, stat: {}, compositeRating: {}};

                        for (j = 0; j < player.ratings.length; j++) {
                            if (player.ratings[j].season === g.season) {
                                rating = player.ratings[j];
                                break;
                            }
                        }

                        p.ovr = rating.ovr;

                        p.compositeRating.pace = _composite(rating, ['spd', 'jmp', 'dnk', 'tp', 'stl', 'drb', 'pss']);
                        p.compositeRating.usage = _composite(rating, ['ins', 'dnk', 'fg', 'tp']);
                        p.compositeRating.ballHandling = _composite(rating, ['drb', 'spd']);
                        p.compositeRating.passing = _composite(rating, ['drb', 'pss']);
                        p.compositeRating.turnovers = _composite(rating, ['drb', 'pss', 'spd'], undefined, -1);
                        p.compositeRating.shootingLowPost = _composite(rating, ['hgt', 'stre', 'spd', 'ins'], [1, 0.6, 0.2, 1]);  // Post scoring
                        p.compositeRating.shootingAtRim = _composite(rating, ['hgt', 'spd', 'jmp', 'dnk'], [1, 0.2, 0.6, 0.4]);  // Dunk or layup, fast break or half court
                        p.compositeRating.shootingMidRange = _composite(rating, ['hgt', 'fg'], [0.2, 1]);  // Two point jump shot
                        p.compositeRating.shootingThreePointer = _composite(rating, ['hgt', 'tp'], [0.2, 1]);  // Three point jump shot
                        p.compositeRating.shootingFT = _composite(rating, ['ft']);  // Free throw
                        p.compositeRating.rebounds = _composite(rating, ['hgt', 'stre', 'jmp', 'reb'], [1, 0.1, 0.1, 0.2]);
                        p.compositeRating.steals = _composite(rating, ['spd', 'stl']);
                        p.compositeRating.blocks = _composite(rating, ['hgt', 'jmp', 'blk']);
                        p.compositeRating.fouls = _composite(rating, ['spd'], undefined, -1);
                        p.compositeRating.defenseInterior = _composite(rating, ['hgt', 'stre', 'spd', 'jmp'], [2, 1, 0.5, 0.5]);
                        p.compositeRating.defensePerimeter = _composite(rating, ['hgt', 'stre', 'spd', 'jmp'], [0.5, 1, 2, 0.5]);

                        p.stat = {gs: 0, min: 0, fg: 0, fga: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0, court_time: 0, bench_time: 0, energy: 1};

                        t.player.push(p);
                    }

                    // Number of players to factor into pace and defense rating calculation
                    numPlayers = t.player.length;
                    if (numPlayers > 7) {
                        numPlayers = 7;
                    }

                    // Would be better if these were scaled by average min played and endurancence
                    t.pace = 0;
                    for (i = 0; i < numPlayers; i++) {
                        t.pace += t.player[i].compositeRating.pace;
                    }
                    t.pace /= numPlayers;
                    t.pace = t.pace * 50 + 90;  // Scale between 90 and 140
                    t.defense = 0;
                    for (i = 0; i < numPlayers; i++) {
                        t.defense += t.player[i].compositeRating.defenseInterior + t.player[i].compositeRating.defensePerimeter;
                    }
                    t.defense /= numPlayers;
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

    /**
     * Play one or more days of games.
     * 
     * This also handles the case where there are no more games to be played by switching the phase to either the playoffs or before the draft, as appropriate.
     * 
     * @param {number} numDays An integer representing the number of days to be simulated. If numDays is larger than the number of days remaining, then all games will be simulated up until either the end of the regular season or the end of the playoffs, whichever happens first.
     * @param {boolean} start Is this a new request from the user to play games (true) or a recursive callback to simulate another day (false)? If true, then there is a check to make sure simulating games is allowed.
     */
    function play(numDays, start) {
        var cbNoGames, cbPlayGames, cbRunDay, playoffsContinue;

        start = start !== undefined ? start : false;

        playoffsContinue = false;

        // This is called when there are no more games to play, either due to the user's request (e.g. 1 week) elapsing or at the end of the regular season or the end of the playoffs.
        cbNoGames = function () {
            ui.updateStatus('Idle');
            db.setGameAttributes({gamesInProgress: false}, function () {
               ui.updatePlayMenu(null, function () {
                   // Check to see if the season is over
                   if (g.phase < c.PHASE_PLAYOFFS) {
                       season.getSchedule(null, 0, function (schedule) {
                           if (schedule.length === 0) {
                               season.newPhase(c.PHASE_PLAYOFFS);
                           }
                       });
                   }
               });
            });
        };

        // Simulates a day of games. If there are no games left, it calls cbNoGames.
        cbPlayGames = function () {
            var transaction;

            ui.updateStatus("Playing games (" + numDays + " days remaining)...");

            // This transaction is used for a day's simulations, first reading data from it and then writing the game results
            transaction = g.dbl.transaction(["games", "players", "playoffSeries", "releasedPlayers", "schedule", "teams"], "readwrite");

            // Get the schedule for today
            season.getSchedule(transaction, 1, function (schedule) {
                var tid;

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

                                    advStats.calculateAll(function () {  // Update all advanced stats every day
                                        ui.realtimeUpdate(function () {
                                            db.setGameAttributes({lastDbChange: Date.now()}, function () {
                                                play(numDays - 1);
                                            });
                                        });
                                    });
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

        // This simulates a day, including game simulation and any other bookkeeping that needs to be done
        cbRunDay = function () {
            var cbYetAnother;

            // This is called if there are remaining days to simulate
            cbYetAnother = function () {
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
                        // If season.newSchedulePlayoffsDay didn't move the phase to c.PHASE_BEFORE_DRAFT, then the playoffs are still happening.
                        if (g.phase === c.PHASE_PLAYOFFS) {
                            playoffsContinue = true;
                        }
                        cbPlayGames();
                    });
                }
            };

            if (numDays > 0) {
                // If we didn't just stop games, let's play
                // Or, if we are starting games (and already passed the lock), continue even if stopGames was just seen
                if (start || !g.stopGames) {
                    if (g.stopGames) {
                        db.setGameAttributes({stopGames: false}, cbYetAnother);
                    }
                    else {
                        cbYetAnother();
                    }
                }
            } else if (numDays === 0) {
                // If this is the last day, update play menu
                cbNoGames();
            }
        }

        // If this is a request to start a new simulation... are we allowed to do
        // that? If so, set the lock and update the play menu
        if (start) {
            lock.canStartGames(null, function (canStartGames) {
                if (canStartGames) {
                    db.setGameAttributes({gamesInProgress: true}, function () {
                        ui.updatePlayMenu(null, function () {
                            cbRunDay();
                        });
                    });
                }
            });
        } else {
            cbRunDay();
        }
    }

    return {
        play: play
    };
});
