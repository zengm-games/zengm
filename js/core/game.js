/**
 * @name core.game
 * @namespace Everything about games except the actual simulation. So, loading the schedule, loading the teams, saving the results, and handling multi-day simulations and what happens when there are no games left to play.
 */
define(["db", "globals", "ui", "core/freeAgents", "core/finances", "core/gameSim", "core/player", "core/season", "lib/underscore", "util/advStats", "util/lock", "util/helpers", "util/random"], function (db, g, ui, freeAgents, finances, gameSim, player, season, _, advStats, lock, helpers, random) {
    "use strict";

    function Game() {
    }

    Game.prototype.writeStats = function (tx, results, playoffs, cb) {
        var gp, that, winp;

        // Retrieve stats
        this.team = results.team;
        this.playoffs = playoffs;
        this.id = results.gid;
        this.overtimes = results.overtimes;
        this.home = [true, false];

        // Are the teams in the same conference/division?
        this.sameConf = false;
        this.sameDiv = false;
        if (this.team[0].cid === this.team[1].cid) {
            this.sameConf = true;
        }
        if (this.team[0].did === this.team[1].did) {
            this.sameDiv = true;
        }

        that = this;

        this.writeTeamStats(tx, 0, function () {
            that.writePlayerStats(tx, 0, 0, function () {
                that.writeGameStats(tx, cb);
            });
        });
    };

    Game.prototype.writePlayerStats = function (tx, t, p, cb) {
        var that;

        that = this;

//console.log('writePlayerStats');
        tx.objectStore("players").openCursor(that.team[t].player[p].id).onsuccess = function (event) {
            var cursor, i, keys, player_, playerStats;

            cursor = event.target.result;
//if (!cursor) { console.log("NO CURSOR " + that.team[t].player[p].id); console.log(that); console.log(event); console.log(cursor); }
            player_ = cursor.value;

            // Find the correct row of stats - should always be the last one, right?
            playerStats = _.last(player_.stats);

            // Update stats
            keys = ['gs', 'min', 'fg', 'fga', 'fgAtRim', 'fgaAtRim', 'fgLowPost', 'fgaLowPost', 'fgMidRange', 'fgaMidRange', 'tp', 'tpa', 'ft', 'fta', 'orb', 'drb', 'ast', 'tov', 'stl', 'blk', 'pf', 'pts'];
            for (i = 0; i < keys.length; i++) {
                playerStats[keys[i]] += that.team[t].player[p].stat[keys[i]];
            }
            // Only count a game played if the player recorded minutes
            if (that.team[t].player[p].stat.min > 0) {
                playerStats.gp += 1;
            }
            playerStats.trb += that.team[t].player[p].stat.orb + that.team[t].player[p].stat.drb;

            // Injury crap - assign injury type if player does not already have an injury in the database
            if (that.team[t].player[p].injured && player_.injury.type === "Healthy") {
                player_.injury = player.injury(that.team[t].healthRank);
            } else if (player_.injury.gamesRemaining > 0) {
                player_.injury.gamesRemaining -= 1;
            }
            // Is it already over?
            if (player_.injury.gamesRemaining <= 0) {
                player_.injury = {type: "Healthy", gamesRemaining: 0};
            }

            cursor.update(player_);

            if (p < that.team[t].player.length - 1) {
                that.writePlayerStats(tx, t, p + 1, cb);
            } else if (t === 0) {
                that.writePlayerStats(tx, 1, 0, cb);
            } else {
                cb();
            }
        };
    };

    Game.prototype.writeTeamStats = function (tx, t1, cb) {
        var t2, that;

        if (t1 === 0) {
            t2 = 1;
        } else {
            t2 = 0;
        }
        that = this;

        // Record progress of playoff series, if appropriate
        if (this.playoffs && t1 === 0) {
            tx.objectStore("playoffSeries").openCursor(g.season).onsuccess = function (event) {
                var cursor, i, playoffRound, playoffSeries, series, won0;

                cursor = event.target.result;
                playoffSeries = cursor.value;
                playoffRound = playoffSeries.series[playoffSeries.currentRound];

                // Did the home (true) or away (false) team win this game? Here, "home" refers to this game, not the team which has homecourt advnatage in the playoffs, which is what series.home refers to below.
                if (that.team[t1].stat.pts > that.team[t2].stat.pts) {
                    won0 = true;
                } else {
                    won0 = false;
                }

                for (i = 0; i < playoffRound.length; i++) {
                    series = playoffRound[i];

                    if (series.home.tid === that.team[t1].id) {
                        if (won0) {
                            series.home.won += 1;
                        } else {
                            series.away.won += 1;
                        }
                    } else if (series.away.tid === that.team[t1].id) {
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

//console.log('writeTeamStats');
        db.getPayroll(tx, that.team[t1].id, function (payroll) {
            // Team stats
//console.log('writeTeamStats 2');
            tx.objectStore("teams").openCursor(that.team[t1].id).onsuccess = function (event) {
                var att, coachingPaid, count, cursor, expenses, facilitiesPaid, healthPaid, i, keys, localTvRevenue, merchRevenue, nationalTvRevenue, revenue, salaryPaid, scoutingPaid, sponsorRevenue, t, teamSeason, teamStats, ticketRevenue, winp, winpOld, won;

                cursor = event.target.result;
                t = cursor.value;

                teamSeason = _.last(t.seasons);
                teamStats = _.last(t.stats);

                if (that.team[t1].stat.pts > that.team[t2].stat.pts) {
                    won = true;
                } else {
                    won = false;
                }

                // Attendance - base calculation now, which is used for other revenue estimates
                att = 10000 + (0.1 + 0.9 * Math.pow(teamSeason.hype, 2)) * teamSeason.pop * 1000000 * 0.01;  // Base attendance - between 2% and 0.2% of the region
                if (that.playoffs) {
                    att *= 1.5;  // Playoff bonus
                }

                // Some things are only paid for regular season games.
                salaryPaid = 0;
                scoutingPaid = 0;
                coachingPaid = 0;
                healthPaid = 0;
                facilitiesPaid = 0;
                merchRevenue = 0;
                sponsorRevenue = 0;
                nationalTvRevenue = 0;
                localTvRevenue = 0;
                if (!that.playoffs) {
                    // All in [thousands of dollars]
                    salaryPaid = payroll / 82;
                    scoutingPaid = t.budget.scouting.amount / 82;
                    coachingPaid = t.budget.coaching.amount / 82;
                    healthPaid = t.budget.health.amount / 82;
                    facilitiesPaid = t.budget.facilities.amount / 82;
                    merchRevenue = 3 * att / 1000;
                    if (merchRevenue > 250) {
                        merchRevenue = 250;
                    }
                    sponsorRevenue = 10 * att / 1000;
                    if (sponsorRevenue > 600) {
                        sponsorRevenue = 600;
                    }
                    nationalTvRevenue = 250;
                    localTvRevenue = 10 * att / 1000;
                    if (localTvRevenue > 1200) {
                        localTvRevenue = 1200;
                    }
                }


                // Attendance - final estimate
                att = random.gauss(att, 1000);
                att *= 30 / t.budget.ticketPrice.amount;  // Attendance depends on ticket price. Not sure if this formula is reasonable.
                att *= 1 + 0.075 * (30 - finances.getRankLastThree(t, "expenses", "facilities")) / 29;  // Attendance depends on facilities. Not sure if this formula is reasonable.
                if (att > 25000) {
                    att = 25000;
                } else if (att < 0) {
                    att = 0;
                }
                ticketRevenue = t.budget.ticketPrice.amount * att / 1000;  // [thousands of dollars]

                // Hype - relative to the expectations of prior seasons
                if (teamSeason.gp > 5 && !that.playoffs) {
                    winp = teamSeason.won / (teamSeason.won + teamSeason.lost);
                    winpOld = 0;
                    count = 0;
                    for (i = t.seasons.length - 2; i >= 0; i--) { // Start at last season, go back
                        winpOld += t.seasons[i].won / (t.seasons[i].won + t.seasons[i].lost);
                        count++;
                        if (count === 4) {
                            break;  // Max 4 seasons
                        }
                    }
                    if (count > 0) {
                        winpOld /= count;
                    } else {
                        winpOld = 0.5;  // Default for new games
                    }

                    teamSeason.hype = teamSeason.hype + 0.01 * (winp - 0.55) + 0.015 * (winp - winpOld);
                    if (teamSeason.hype > 1) {
                        teamSeason.hype = 1;
                    } else if (teamSeason.hype < 0) {
                        teamSeason.hype = 0;
                    }
                }

                revenue = merchRevenue + sponsorRevenue + nationalTvRevenue + localTvRevenue + ticketRevenue;
                expenses = salaryPaid + scoutingPaid + coachingPaid + healthPaid + facilitiesPaid;
                teamSeason.cash += revenue - expenses;
                teamSeason.att += att;
                teamSeason.gp += 1;
                teamSeason.revenues.merch.amount += merchRevenue;
                teamSeason.revenues.sponsor.amount += sponsorRevenue;
                teamSeason.revenues.nationalTv.amount += nationalTvRevenue;
                teamSeason.revenues.localTv.amount += localTvRevenue;
                teamSeason.revenues.ticket.amount += ticketRevenue;
                teamSeason.expenses.salary.amount += salaryPaid;
                teamSeason.expenses.scouting.amount += scoutingPaid;
                teamSeason.expenses.coaching.amount += coachingPaid;
                teamSeason.expenses.health.amount += healthPaid;
                teamSeason.expenses.facilities.amount += facilitiesPaid;

                keys = ['min', 'fg', 'fga', 'fgAtRim', 'fgaAtRim', 'fgLowPost', 'fgaLowPost', 'fgMidRange', 'fgaMidRange', 'tp', 'tpa', 'ft', 'fta', 'orb', 'drb', 'ast', 'tov', 'stl', 'blk', 'pf', 'pts'];
                for (i = 0; i < keys.length; i++) {
                    teamStats[keys[i]] += that.team[t1].stat[keys[i]];
                }
                teamStats.gp += 1;
                teamStats.trb += that.team[t1].stat.orb + that.team[t1].stat.drb;
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

                    if (t1 === 0) {
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

                    if (t1 === 0) {
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

                cursor.update(t);

                if (t1 === 0) {
                    that.writeTeamStats(tx, 1, cb);
                } else {
                    cb();
                }
            };
        });
    };

    Game.prototype.writeGameStats = function (tx, cb) {
        var gameStats, i, keys, p, t, team, teams, tl, tw;

        gameStats = {gid: this.id, season: g.season, playoffs: this.playoffs, overtimes: this.overtimes, won: {}, lost: {}, teams: [{tid: this.team[0].id, players: []}, {tid: this.team[1].id, players: []}]};
        for (t = 0; t < 2; t++) {
            keys = ['min', 'fg', 'fga', 'fgAtRim', 'fgaAtRim', 'fgLowPost', 'fgaLowPost', 'fgMidRange', 'fgaMidRange', 'tp', 'tpa', 'ft', 'fta', 'orb', 'drb', 'ast', 'tov', 'stl', 'blk', 'pf', 'pts'];
            for (i = 0; i < keys.length; i++) {
                gameStats.teams[t][keys[i]] = this.team[t].stat[keys[i]];
            }
            gameStats.teams[t].trb = this.team[t].stat.orb + this.team[t].stat.drb;

            for (p = 0; p < this.team[t].player.length; p++) {
                gameStats.teams[t].players[p] = {name: this.team[t].player[p].name, pos: this.team[t].player[p].pos};
                keys.unshift("gs");  // Also record starters, in addition to other stats
                for (i = 0; i < keys.length; i++) {
                    gameStats.teams[t].players[p][keys[i]] = this.team[t].player[p].stat[keys[i]];
                }
                gameStats.teams[t].players[p].trb = this.team[t].player[p].stat.orb + this.team[t].player[p].stat.drb;
                gameStats.teams[t].players[p].pid = this.team[t].player[p].id;
                gameStats.teams[t].players[p].skills = this.team[t].player[p].skills;
                if (this.team[t].player[p].injured) {
                    gameStats.teams[t].players[p].injury = {type: "Injured", gamesRemaining: -1};
                } else {
                    gameStats.teams[t].players[p].injury = {type: "Healthy", gamesRemaining: 0};
                }
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

        teams = helpers.getTeams();

        team = teams[this.team[tw].id];
        gameStats.won.abbrev = team.abbrev;
        gameStats.won.region = team.region;
        gameStats.won.name = team.name;
        gameStats.teams[tw].abbrev = team.abbrev;
        gameStats.teams[tw].region = team.region;
        gameStats.teams[tw].name = team.name;

        team = teams[this.team[tl].id];
        gameStats.lost.abbrev = team.abbrev;
        gameStats.lost.region = team.region;
        gameStats.lost.name = team.name;
        gameStats.teams[tl].abbrev = team.abbrev;
        gameStats.teams[tl].region = team.region;
        gameStats.teams[tl].name = team.name;

        gameStats.won.pts = this.team[tw].stat.pts;
        gameStats.lost.pts = this.team[tl].stat.pts;

//console.log('writeGameStats');
        tx.objectStore("games").add(gameStats);

        cb();
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
     * @return {number} Composite rating, a number between 0 and 1.
     */
    function _composite(rating, components, weights) {
        var add, component, divideBy, i, r, rcomp, rmax, sign, y;

        if (weights === undefined) {
            // Default: array of ones with same size as components
            weights = [];
            for (i = 0; i < components.length; i++) {
                weights.push(1);
            }
        }

        r = 0;
        rmax = 0;
        divideBy = 0;
        for (i = 0; i < components.length; i++) {
            component = components[i];
            // Sigmoidal transformation
            //y = (rating[component] - 70) / 10;
            //rcomp = y / Math.sqrt(1 + Math.pow(y, 2));
            //rcomp = (rcomp + 1) * 50;
            rcomp = weights[i] * rating[component];

            r = r + rcomp;

            divideBy = divideBy + 100 * weights[i];
        }

        r = r / divideBy;  // Scale from 0 to 1
        if (r > 1) {
            r = 1;
        } else if (r < 0) {
            r = 0;
        }

        return r;
    }

    /**
     * Load all teams into an array of team objects.
     * 
     * The team objects contain all the information needed to simulate games. It would be more efficient if it only loaded team data for teams that are actually playing, particularly in the playoffs.
     * 
     * @memberOf core.game
     * @param {IDBTransaction} transaction An IndexedDB transaction on players and teams.
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
                t = {id: realTid, defense: 0, pace: 0, won: 0, lost: 0, cid: 0, did: 0, stat: {}, player: [], synergy: {off: 0, def: 0, reb: 0}};
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
                    t.healthRank = teamSeason.expenses.health.rank;

                    for (i = 0; i < players.length; i++) {
                        player = players[i];
                        p = {id: player.pid, name: player.name, pos: player.pos, ovr: 0, stat: {}, compositeRating: {}, skills: [], injured: player.injury.type !== "Healthy"};

                        for (j = 0; j < player.ratings.length; j++) {
                            if (player.ratings[j].season === g.season) {
                                rating = player.ratings[j];
                                break;
                            }
                        }

                        p.skills = rating.skills;

                        p.ovr = rating.ovr;

                        p.compositeRating.pace = _composite(rating, ['spd', 'jmp', 'dnk', 'tp', 'stl', 'drb', 'pss']);
                        p.compositeRating.usage = _composite(rating, ['ins', 'dnk', 'fg', 'tp']);
                        p.compositeRating.dribbling = _composite(rating, ['drb', 'spd']);
                        p.compositeRating.passing = _composite(rating, ['drb', 'pss'], [0.4, 1]);
                        p.compositeRating.turnovers = _composite(rating, ['drb', 'pss', 'spd', 'hgt', 'ins'], [1, 1, -1, 1, 1]);  // This should not influence whether a turnover occurs, it should just be used to assign players
                        p.compositeRating.shootingAtRim = _composite(rating, ['hgt', 'spd', 'jmp', 'dnk'], [1, 0.2, 0.6, 0.4]);  // Dunk or layup, fast break or half court
                        p.compositeRating.shootingLowPost = _composite(rating, ['hgt', 'stre', 'spd', 'ins'], [1, 0.6, 0.2, 1]);  // Post scoring
                        p.compositeRating.shootingMidRange = _composite(rating, ['hgt', 'fg'], [0.2, 1]);  // Two point jump shot
                        p.compositeRating.shootingThreePointer = _composite(rating, ['hgt', 'tp'], [0.2, 1]);  // Three point jump shot
                        p.compositeRating.shootingFT = _composite(rating, ['ft']);  // Free throw
                        p.compositeRating.rebounding = _composite(rating, ['hgt', 'stre', 'jmp', 'reb'], [1.5, 0.1, 0.1, 0.7]);
                        p.compositeRating.stealing = _composite(rating, ['spd', 'stl']);
                        p.compositeRating.blocking = _composite(rating, ['hgt', 'jmp', 'blk'], [1.5, 0.5, 0.5]);
                        p.compositeRating.fouling = _composite(rating, ['hgt', 'blk', 'spd'], [1, 1, -1]);
                        p.compositeRating.defense = _composite(rating, ['hgt', 'stre', 'spd', 'jmp', 'blk', 'stl'], [1, 1, 1, 0.5, 1, 1]);
                        p.compositeRating.defenseInterior = _composite(rating, ['hgt', 'stre', 'spd', 'jmp', 'blk'], [2, 1, 0.5, 0.5, 1]);
                        p.compositeRating.defensePerimeter = _composite(rating, ['hgt', 'stre', 'spd', 'jmp', 'stl'], [1, 1, 2, 0.5, 1]);
                        p.compositeRating.endurance = _composite(rating, ['endu', 'hgt'], [1, -0.1]);

                        p.stat = {gs: 0, min: 0, fg: 0, fga: 0, fgAtRim: 0, fgaAtRim: 0, fgLowPost: 0, fgaLowPost: 0, fgMidRange: 0, fgaMidRange: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0, courtTime: 0, benchTime: 0, energy: 1};

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
                    t.pace = t.pace * 15 + 100;  // Scale between 100 and 115

                    // Initialize team composite rating object
                    t.compositeRating = {};
                    for (rating in p.compositeRating) {
                        if (p.compositeRating.hasOwnProperty(rating)) {
                            t.compositeRating[rating] = 0;
                        }
                    }

                    t.stat = {min: 0, fg: 0, fga: 0, fgAtRim: 0, fgaAtRim: 0, fgLowPost: 0, fgaLowPost: 0, fgMidRange: 0, fgaMidRange: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0};
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
     * @memberOf core.game
     * @param {number} numDays An integer representing the number of days to be simulated. If numDays is larger than the number of days remaining, then all games will be simulated up until either the end of the regular season or the end of the playoffs, whichever happens first.
     * @param {boolean} start Is this a new request from the user to play games (true) or a recursive callback to simulate another day (false)? If true, then there is a check to make sure simulating games is allowed.
     */
    function play(numDays, start) {
        var cbNoGames, cbPlayGames, cbSaveResults, cbSimGames, cbRunDay, playoffsContinue;

        start = start !== undefined ? start : false;

        playoffsContinue = false;

        // This is called when there are no more games to play, either due to the user's request (e.g. 1 week) elapsing or at the end of the regular season or the end of the playoffs.
        cbNoGames = function () {
            ui.updateStatus("Idle");
            db.setGameAttributes({gamesInProgress: false}, function () {
                ui.updatePlayMenu(null, function () {
                    // Check to see if the season is over
                    if (g.phase < g.PHASE.PLAYOFFS) {
                        season.getSchedule(null, 0, function (schedule) {
                            if (schedule.length === 0) {
                                season.newPhase(g.PHASE.PLAYOFFS);
                            }
                        });
                    }
                    ui.updateStatus("Idle");  // Just to be sure..
                });
            });
        };

        // Saves a vector of results objects for a day, as is output from cbSimGames
        cbSaveResults = function (results) {
            var cbSaveResult, gidsFinished, gm, i, playoffs, tx;

            gidsFinished = [];
            playoffs = g.phase === g.PHASE.PLAYOFFS;

            tx = g.dbl.transaction(["games", "players", "playoffSeries", "releasedPlayers", "schedule", "teams"], "readwrite");
//tx = g.dbl.transaction(["players", "schedule"], "readwrite");

            cbSaveResult = function (i) {
//console.log('cbSaveResult ' + i)
                // Save the game ID so it can be deleted from the schedule below
                gidsFinished.push(results[i].gid);

                gm = new Game();
//console.log(results[i]);
                gm.writeStats(tx, results[i], playoffs, function () {
                    var j, scheduleStore;

                    if (i > 0) {
                        cbSaveResult(i - 1);
                    } else {
                        // Delete finished games from schedule
                        scheduleStore = tx.objectStore("schedule");
                        for (j = 0; j < gidsFinished.length; j++) {
                            scheduleStore.delete(gidsFinished[j]);
                        }

                        // Update ranks
                        finances.updateRanks(tx, ["expenses", "revenues"]);
                    }
                });
            };

            cbSaveResult(results.length - 1);

            tx.oncomplete = function () {
//console.log('oncomplete')
                advStats.calculateAll(function () {  // Update all advanced stats every day
                    ui.realtimeUpdate(["gameSim"], function () {
                        db.setGameAttributes({lastDbChange: Date.now()}, function () {
                            play(numDays - 1);
                        });
                    });
                });
            };
        };

        // Simulates a day of games (whatever is in schedule) and passes the results to cbSaveResults
        cbSimGames = function (schedule, teams) {
            var gs, i, results;
/*            var cbWorker, data, numWorkersFinished, i, gs, numWorkers, results, schedules;

            numWorkers = g.gameSimWorkers.length;
            numWorkersFinished = 0;

            // Separate results and schedules for each worker
            schedules = [];
            results = [];
            for (i = 0; i < numWorkers; i++) {
                schedules.push([]);
                results.push([]);
            }

            // Divide schedule evenly among workers
            for (i = 0; i < schedule.length; i++) {
                // all the information needed to run gameSim.GameSim
                schedules[i % numWorkers].push({
                    gid: schedule[i].gid,
                    homeTeam: teams[schedule[i].homeTid],
                    awayTeam: teams[schedule[i].awayTid]
                });
            }

            for (i = 0; i < numWorkers; i++) {
                // Set callback for worker
                g.gameSimWorkers[i].onmessage = (function (i) {
                    return function (event) {
                        results[i].push(event.data);
                        numWorkersFinished += 1;
                        if (numWorkersFinished === numWorkers) {
                            cbSaveResults(_.flatten(results));
                        }
                    };
                }(i));

                // Send data to worker
                g.gameSimWorkers[i].postMessage(schedules[i]);
            }*/

            results = [];
            for (i = 0; i < schedule.length; i++) {
                gs = new gameSim.GameSim(schedule[i].gid, teams[schedule[i].homeTid], teams[schedule[i].awayTid]);
                results.push(gs.run());
            }
            cbSaveResults(results);
        };

        // Simulates a day of games. If there are no games left, it calls cbNoGames.
        cbPlayGames = function () {
            var tx;

            ui.updateStatus("Playing games (" + numDays + " days remaining)...");

            tx = g.dbl.transaction(["players", "schedule", "teams"]);

            // Get the schedule for today
            season.getSchedule(tx, 1, function (schedule) {
                var tid;

                if (schedule.length === 0 && !playoffsContinue) {
                    cbNoGames();
                } else {
                    // Load all teams, for now. Would be more efficient to load only some of them, I suppose.
                    loadTeams(tx, function (teams) {
                        teams.sort(function (a, b) {  return a.id - b.id; });  // Order teams by tid

                        // Play games
                        if (schedule.length > 0) {
                            // Will loop through schedule and simulate all games
                            cbSimGames(schedule, teams);
                        } else if (playoffsContinue) {
                            // In the playoffs, keep going even if there is no more schedule set.
                            play(numDays - 1);
                        }
                    });
                }
            });
        };

        // This simulates a day, including game simulation and any other bookkeeping that needs to be done
        cbRunDay = function () {
            var cbYetAnother;

            // This is called if there are remaining days to simulate
            cbYetAnother = function () {
                // Check if it's the playoffs and do some special stuff if it is or isn't
                if (g.phase !== g.PHASE.PLAYOFFS) {
                    // Decrease free agent demands and let AI teams sign them
                    freeAgents.decreaseDemands(function () {
                        freeAgents.autoSign(function () {
                            cbPlayGames();
                        });
                    });
                } else {
                    season.newSchedulePlayoffsDay(function () {
                        // If season.newSchedulePlayoffsDay didn't move the phase to g.PHASE.BEFORE_DRAFT, then the playoffs are still happening.
                        if (g.phase === g.PHASE.PLAYOFFS) {
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
                    } else {
                        cbYetAnother();
                    }
                }
            } else if (numDays === 0) {
                // If this is the last day, update play menu
                cbNoGames();
            }
        };

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
