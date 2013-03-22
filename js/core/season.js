/**
 * @name core.season
 * @namespace Somewhat of a hodgepodge. Basically, this is for anything related to a single season that doesn't deserve to be broken out into its own file. Currently, this includes things that happen when moving between phases of the season (i.e. regular season to playoffs) and scheduling. As I write this, I realize that it might make more sense to break up those two classes of functions into two separate modules, but oh well.
 */
define(["db", "globals", "ui", "core/contractNegotiation", "core/finances", "core/freeAgents", "core/player", "core/team", "lib/davis", "lib/handlebars.runtime", "lib/underscore", "util/helpers", "util/message", "util/random"], function (db, g, ui, contractNegotiation, finances, freeAgents, player, team, Davis, Handlebars, _, helpers, message, random) {
    "use strict";

    /**
     * Update g.ownerMood based on performance this season.
     *
     * This is based on three factors: regular season performance, playoff performance, and finances.
     * 
     * @memberOf core.season
     * @param {function(Object)} cb Callback function whose argument is an object containing the changes in g.ownerMood this season.
     */
    function updateOwnerMood(cb) {
        if (g.season !== g.startingSeason) {
            g.dbl.transaction("teams").objectStore("teams").get(g.userTid).onsuccess = function (event) {
                var deltas, ownerMood, t;

                t = db.getTeam(event.target.result, g.season - 1, [], [], ["won", "playoffRoundsWon", "profit"], {});

                deltas = {};
                deltas.wins = 0.25 * (t.won - 41) / 41;
                if (t.playoffRoundsWon < 0) {
                    deltas.playoffs = -0.2;
                } else if (t.playoffRoundsWon < 4) {
                    deltas.playoffs = 0.04 * t.playoffRoundsWon;
                } else {
                    deltas.playoffs = 0.2;
                }
                deltas.money = (t.profit - 15) / 100;

                ownerMood = {};
                ownerMood.wins = g.ownerMood.wins + deltas.wins;
                ownerMood.playoffs = g.ownerMood.playoffs + deltas.playoffs;
                ownerMood.money = g.ownerMood.money + deltas.money;

                // Bound only the top - can't win the game by doing only one thing, but you can lose it by neglecting one thing
                if (ownerMood.wins > 1) { ownerMood.wins = 1; }
                if (ownerMood.playoffs > 1) { ownerMood.playoffs = 1; }
                if (ownerMood.money > 1) { ownerMood.money = 1; }

                db.setGameAttributes({ownerMood: ownerMood}, function () {
                    cb(deltas);
                });
            };
        } else {
            cb({wins: 0, playoffs: 0, money: 0});
        }
    }

    /**
     * Compute the awards (MVP, etc) after a season finishes.
     *
     * The awards are saved to the "awards" object store.
     *
     * @memberOf core.season
     * @param {function()} cb Callback function.
     */
    function awards(cb) {
        var awardsByPlayer, cbAwardsByPlayer, transaction;

        // [{pid, type}]
        awardsByPlayer = [];

        cbAwardsByPlayer = function (awardsByPlayer, cb) {
            var i, pids, tx;

            pids = _.uniq(_.pluck(awardsByPlayer, "pid"));

            tx = g.dbl.transaction("players", "readwrite");
            for (i = 0; i < pids.length; i++) {
                tx.objectStore("players").openCursor(pids[i]).onsuccess = function (event) {
                    var cursor, i, p, updated;

                    cursor = event.target.result;
                    p = cursor.value;

                    updated = false;
                    for (i = 0; i < awardsByPlayer.length; i++) {
                        if (p.pid === awardsByPlayer[i].pid) {
                            p.awards.push({season: g.season, type: awardsByPlayer[i].type});
                            updated = true;
                        }
                    }

                    if (updated) {
                        cursor.update(p);
                    }
                };
            }
            tx.oncomplete = function () {
                cb();
            };
        };

        transaction = g.dbl.transaction(["players", "releasedPlayers", "teams"]);

        // Any non-retired player can win an award
        transaction.objectStore("players").index("tid").getAll(IDBKeyRange.lowerBound(g.PLAYER.RETIRED, true)).onsuccess = function (event) {
            var attributes, awards, i, p, players, ratings, seasonAttributes, stats, type;

            awards = {season: g.season};

            attributes = ["pid", "name", "tid", "abbrev", "draft"];
            stats = ["gp", "gs", "min", "pts", "trb", "ast", "blk", "stl"];
            ratings = [];
            players = db.getPlayers(event.target.result, g.season, null, attributes, stats, ratings);

            // Most Valuable Player
            players.sort(function (a, b) {  return (0.75 * b.stats.pts + b.stats.ast + b.stats.trb) - (0.75 * a.stats.pts + a.stats.ast + a.stats.trb); });
            p = players[0];
            awards.mvp = {pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, pts: p.stats.pts, trb: p.stats.trb, ast: p.stats.ast};
            awardsByPlayer.push({pid: p.pid, type: "Most Valuable Player"});

            // Sixth Man of the Year - same sort as MVP
            for (i = 0; i < players.length; i++) {
                // Must have come off the bench in most games
                if (players[i].stats.gs === 0 || players[i].stats.gp / players[i].stats.gs > 2) {
                    break;
                }
            }
            p = players[i];
            awards.smoy = {pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, pts: p.stats.pts, trb: p.stats.trb, ast: p.stats.ast};
            awardsByPlayer.push({pid: p.pid, type: "Sixth Man of the Year"});

            // Rookie of the Year - same sort as MVP
            for (i = 0; i < players.length; i++) {
                // This doesn't factor in players who didn't start playing right after being drafted, because currently that doesn't really happen in the game.
                if (players[i].draft.year === g.season - 1) {
                    break;
                }
            }
            p = players[i];
            if (p !== undefined) { // I suppose there could be no rookies at all.. which actually does happen when skip the draft from the debug menu
                awards.roy = {pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, pts: p.stats.pts, trb: p.stats.trb, ast: p.stats.ast};
                awardsByPlayer.push({pid: p.pid, type: "Rookie of the Year"});
            }

            // All League Team - same sort as MVP
            awards.allLeague = [{title: "First Team", players: []}];
            type = "First Team All-League";
            for (i = 0; i < 15; i++) {
                p = players[i];
                if (i === 5) {
                    awards.allLeague.push({title: "Second Team", players: []});
                    type = "Second Team All-League";
                } else if (i === 10) {
                    awards.allLeague.push({title: "Third Team", players: []});
                    type = "Third Team All-League";
                }
                _.last(awards.allLeague).players.push({pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, pts: p.stats.pts, trb: p.stats.trb, ast: p.stats.ast});
                awardsByPlayer.push({pid: p.pid, type: type});
            }

            // Defensive Player of the Year
            players.sort(function (a, b) {  return (b.stats.trb + 5 * b.stats.blk + 5 * b.stats.stl) - (a.stats.trb + 5 * a.stats.blk + 5 * a.stats.stl); });
            p = players[0];
            awards.dpoy = {pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, trb: p.stats.trb, blk: p.stats.blk, stl: p.stats.stl};
            awardsByPlayer.push({pid: p.pid, type: "Defensive Player of the Year"});

            // All Defensive Team - same sort as DPOY
            awards.allDefensive = [{title: "First Team", players: []}];
            type = "First Team All-Defensive";
            for (i = 0; i < 15; i++) {
                p = players[i];
                if (i === 5) {
                    awards.allDefensive.push({title: "Second Team", players: []});
                    type = "Second Team All-Defensive";
                } else if (i === 10) {
                    awards.allDefensive.push({title: "Third Team", players: []});
                    type = "Third Team All-Defensive";
                }
                _.last(awards.allDefensive).players.push({pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, trb: p.stats.trb, blk: p.stats.blk, stl: p.stats.stl});
                awardsByPlayer.push({pid: p.pid, type: type});
            }

            attributes = ["tid", "abbrev", "region", "name", "cid"];
            stats = [];
            seasonAttributes = ["won", "lost", "winp"];
            db.getTeams(transaction, g.season, attributes, stats, seasonAttributes, {sortBy: "winp"}, function (teams) {
                var i, foundEast, foundWest, t, tx;

                for (i = 0; i < teams.length; i++) {
                    if (!foundEast && teams[i].cid === 0) {
                        t = teams[i];
                        awards.bre = {tid: t.tid, abbrev: t.abbrev, region: t.region, name: t.name, won: t.won, lost: t.lost};
                        foundEast = true;
                    } else if (!foundWest && teams[i].cid === 1) {
                        t = teams[i];
                        awards.brw = {tid: t.tid, abbrev: t.abbrev, region: t.region, name: t.name, won: t.won, lost: t.lost};
                        foundWest = true;
                    }

                    if (foundEast && foundWest) {
                        break;
                    }
                }

                tx = g.dbl.transaction("awards", "readwrite");
                tx.objectStore("awards").add(awards);
                tx.oncomplete = function () {
                    cbAwardsByPlayer(awardsByPlayer, cb);
                };
            });
        };
    }

    /**
     * Creates a new regular season schedule.
     *
     * This makes an NBA-like schedule in terms of conference matchups, division matchups, and home/away games.
     * 
     * @memberOf core.season
     * @return {Array.<Array.<number>>} All the season's games. Each element in the array is an array of the home team ID and the away team ID, respectively.
     */
    function newSchedule() {
        var cid, days, dids, game, games, good, i, ii, iters, j, jj, jMax, k, matchup, matchups, n, newMatchup, t, team, teams, teamsAll, tids, tidsByConf, tidsInDays, tryNum, used;

        teamsAll = helpers.getTeams();
        teams = [];
        tids = [];  // tid_home, tid_away

        // Collect info needed for scheduling
        for (i = 0; i < teamsAll.length; i++) {
            team = teamsAll[i];
            teams.push({tid: team.tid, cid: team.cid, did: team.did, homeGames: 0, awayGames: 0});
        }
        for (i = 0; i < teams.length; i++) {
            for (j = 0; j < teams.length; j++) {
                if (teams[i].tid !== teams[j].tid) {
                    game = [teams[i].tid, teams[j].tid];

                    // Constraint: 1 home game vs. each team in other conference
                    if (teams[i].cid !== teams[j].cid) {
                        tids.push(game);
                        teams[i].homeGames += 1;
                        teams[j].awayGames += 1;
                    }

                    // Constraint: 2 home schedule vs. each team in same division
                    if (teams[i].did === teams[j].did) {
                        tids.push(game);
                        tids.push(game);
                        teams[i].homeGames += 2;
                        teams[j].awayGames += 2;
                    }

                    // Constraint: 1-2 home schedule vs. each team in same conference and different division
                    // Only do 1 now
                    if (teams[i].cid === teams[j].cid && teams[i].did !== teams[j].did) {
                        tids.push(game);
                        teams[i].homeGames += 1;
                        teams[j].awayGames += 1;
                    }
                }
            }
        }

        // Constraint: 1-2 home schedule vs. each team in same conference and different division
        // Constraint: We need 8 more of these games per home team!
        tidsByConf = [[], []];
        dids = [[], []];
        for (i = 0; i < teams.length; i++) {
            tidsByConf[teams[i].cid].push(i);
            dids[teams[i].cid].push(teams[i].did);
        }

        for (cid = 0; cid < 2; cid++) {
            matchups = [];
            matchups.push([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
            games = 0;
            while (games < 8) {
                newMatchup = [];
                n = 0;
                while (n <= 14) {  // 14 = num teams in conference - 1
                    iters = 0;
                    while (true) {
                        tryNum = random.randInt(0, 14);
                        // Pick tryNum such that it is in a different division than n and has not been picked before
                        if (dids[cid][tryNum] !== dids[cid][n] && newMatchup.indexOf(tryNum) < 0) {
                            good = true;
                            // Check for duplicate games
                            for (j = 0; j < matchups.length; j++) {
                                matchup = matchups[j];
                                if (matchup[n] === tryNum) {
                                    good = false;
                                    break;
                                }
                            }
                            if (good) {
                                newMatchup.push(tryNum);
                                break;
                            }
                        }
                        iters += 1;
                        // Sometimes this gets stuck (for example, first 14 teams in fine but 15th team must play itself)
                        // So, catch these situations and reset the newMatchup
                        if (iters > 50) {
                            newMatchup = [];
                            n = -1;
                            break;
                        }
                    }
                    n += 1;
                }
                matchups.push(newMatchup);
                games += 1;
            }
            matchups.shift();  // Remove the first row in matchups
            for (j = 0; j < matchups.length; j++) {
                matchup = matchups[j];
                for (k = 0; k < matchup.length; k++) {
                    t = matchup[k];
                    ii = tidsByConf[cid][t];
                    jj = tidsByConf[cid][matchup[t]];
                    game = [teams[ii].tid, teams[jj].tid];
                    tids.push(game);
                    teams[ii].homeGames += 1;
                    teams[jj].awayGames += 1;
                }
            }
        }

        // Order the schedule so that it takes fewer days to play
        random.shuffle(tids);
        days = [[]];
        tidsInDays = [[]];
        jMax = 0;
        for (i = 0; i < tids.length; i++) {
            used = false;
            for (j = 0; j <= jMax; j++) {
                if (tidsInDays[j].indexOf(tids[i][0]) < 0 && tidsInDays[j].indexOf(tids[i][1]) < 0) {
                    tidsInDays[j].push(tids[i][0]);
                    tidsInDays[j].push(tids[i][1]);
                    days[j].push(tids[i]);
                    used = true;
                    break;
                }
            }
            if (!used) {
                days.push([tids[i]]);
                tidsInDays.push([tids[i][0], tids[i][1]]);
                jMax += 1;
            }
        }
        random.shuffle(days);  // Otherwise the most dense days will be at the beginning and the least dense days will be at the end
        tids = _.flatten(days, true);

        return tids;
    }

    /**
     * Save the schedule to the database, overwriting what's currently there.
     * 
     * @memberOf core.season
     * @param {Array} tids A list of lists, each containing the team IDs of the home and
            away teams, respectively, for every game in the season, respectively.
     * @param {function()} cb Callback function run after the database operations finish.
     */
    function setSchedule(tids, cb) {
        var i, row, schedule, scheduleStore, teams, tx;

        teams = helpers.getTeams();

        schedule = [];
        for (i = 0; i < tids.length; i++) {
            row = {homeTid: tids[i][0], awayTid: tids[i][1]};
            row.homeAbbrev = teams[row.homeTid].abbrev;
            row.homeRegion = teams[row.homeTid].region;
            row.homeName = teams[row.homeTid].name;
            row.awayAbbrev = teams[row.awayTid].abbrev;
            row.awayRegion = teams[row.awayTid].region;
            row.awayName = teams[row.awayTid].name;
            schedule.push(row);
        }

        tx = g.dbl.transaction("schedule", "readwrite");
        scheduleStore = tx.objectStore("schedule");
        scheduleStore.getAll().onsuccess = function (event) {
            var currentSchedule, i;

            currentSchedule = event.target.result;
            for (i = 0; i < currentSchedule.length; i++) {
                scheduleStore.delete(currentSchedule[i].gid);
            }

            for (i = 0; i < schedule.length; i++) {
                scheduleStore.add(schedule[i]);
            }
        };
        tx.oncomplete = cb;
    }

    /**
     * Common tasks run after a new phrase is set.
     *
     * This updates the phase, executes a callback, and (if necessary) reloads the UI. It should only be called from one of the NewPhase* functions defined below.
     * 
     * @memberOf core.season
     * @param {number} phase Integer representing the new phase of the game (see other functions in this module).
     * @param {string} phaseText Textual representation of the new phase, which will be displayed in the UI.
     * @param {function()=} cb Optional callback run after the phase is set and the play menu is updated.
     * @param {boolean=} reload Optional boolean (defaul false) which, if set to true, will reload the current page before (after? both?) calling the callback.
     */
    function newPhaseCb(phase, phaseText, cb, reload) {
        db.setGameAttributes({phase: phase, lastDbChange: Date.now()}, function () {
            ui.updatePhase(phaseText);
            ui.updatePlayMenu(null, function () {
                if (cb !== undefined) {
                    cb();
                }
                if (reload !== undefined && reload) {
                    Davis.location.replace(new Davis.Request(location.pathname));
                }
            });
        });
    }

    function newPhasePreseason(cb) {
        db.setGameAttributes({season: g.season + 1}, function () {
            var coachingRanks, phaseText, scoutingRank, tx;

            phaseText = g.season + " preseason";

            coachingRanks = [];

            tx = g.dbl.transaction(["players", "teams"], "readwrite");

            // Add row to team stats and season attributes
            tx.objectStore("teams").openCursor().onsuccess = function (event) {
                var cursor, t;

                cursor = event.target.result;
                if (cursor) {
                    t = cursor.value;

                    // Save the coaching rank for later
                    coachingRanks[t.tid] = _.last(t.seasons).expenses.coaching.rank;

                    // Only need scoutingRank for the user's team to calculate fuzz when ratings are updated below.
                    // This is done BEFORE a new season row is added.
                    if (t.tid === g.userTid) {
                        scoutingRank = finances.getRankLastThree(t, "expenses", "scouting");
                    }

                    t = team.addSeasonRow(t);
                    t = team.addStatsRow(t);

                    cursor.update(t);
                    cursor.continue();
                } else {
                    // Loop through all non-retired players
                    tx.objectStore("players").index("tid").openCursor(IDBKeyRange.lowerBound(g.PLAYER.RETIRED, true)).onsuccess = function (event) {
                        var cursorP, p;

                        cursorP = event.target.result;
                        if (cursorP) {
                            p = cursorP.value;

                            // Update ratings
                            p = player.addRatingsRow(p, scoutingRank);
                            p = player.develop(p, 1, false, coachingRanks[p.tid]);

                            // Add row to player stats if they are on a team
                            if (p.tid >= 0) {
                                p = player.addStatsRow(p);
                            }

                            cursorP.update(p);
                            cursorP.continue();
                        }
                    };
                }
            };

            tx.oncomplete = function () {
                // AI teams sign free agents
                freeAgents.autoSign(function () {
                    newPhaseCb(g.PHASE.PRESEASON, phaseText, cb, true);
                });
            };
        });
    }

    function newPhaseRegularSeason(cb) {
        var checkRosterSize, done, phaseText, playerStore, transaction, userTeamSizeError;

        phaseText = g.season + " regular season";

        checkRosterSize = function (tid) {
            playerStore.index("tid").getAll(tid).onsuccess = function (event) {
                var i, numPlayersOnRoster, players, playersAll, tids;

                playersAll = event.target.result;
                numPlayersOnRoster = playersAll.length;
                if (numPlayersOnRoster > 15) {
                    if (tid === g.userTid) {
                        helpers.error("Your team currently has more than the maximum number of players (15). You must release or buy out players (from the Roster page) before the season starts.");
                        userTeamSizeError = true;
                        ui.updatePlayMenu();  // Otherwise the play menu will be blank
                    } else {
                        // Automatically drop lowest potential players until we reach 15
                        players = [];
                        for (i = 0; i < playersAll.length; i++) {
                            players.push({pid: playersAll[i].pid, pot: _.last(playersAll[i].ratings).pot});
                        }
                        players.sort(function (a, b) {  return a.pot - b.pot; });
                        for (i = 0; i < (numPlayersOnRoster - 15); i++) {
                            playerStore.get(players[i].pid).onsuccess = function (event) {
                                player.release(transaction, event.target.result);
                            };
                        }
                    }
                } else if (numPlayersOnRoster < 5) {
                    if (tid === g.userTid) {
                        helpers.error("Your team currently has less than the minimum number of players (5). You must add players (through free agency or trades) before the season starts.");
                        userTeamSizeError = true;
                        ui.updatePlayMenu();  // Otherwise the play menu will be blank
                    }/* else {
                        // Should auto-add players
                    }*/
                }

                done += 1;
                if (done === g.numTeams && !userTeamSizeError) {
                    tids = newSchedule();
                    // 4th parameter of newPhaseCb will reload the page when true. Don't do this if this is the first season, as that means the new league menu is still displayed (probably) and views.newLeague will handle a redirect to the league dashboard.
                    setSchedule(tids, function () { newPhaseCb(g.PHASE.REGULAR_SEASON, phaseText, cb, g.season !== g.startingSeason); });

                    // Auto sort rosters (except player's team)
                    for (tid = 0; tid < g.numTeams; tid++) {
                        if (tid !== g.userTid) {
                            db.rosterAutoSort(playerStore, tid);
                        }
                    }
                }
            };
        };

        updateOwnerMood(function (deltas) {
            message.generate(deltas, function () {
                transaction = g.dbl.transaction(["players", "releasedPlayers", "teams"], "readwrite");
                playerStore = transaction.objectStore("players");

                done = 0;
                userTeamSizeError = false;

                // Make sure teams are all within the roster limits
                transaction.objectStore("teams").getAll().onsuccess = function (event) {
                    var i, teams;

                    teams = event.target.result;
                    for (i = 0; i < teams.length; i++) {
                        checkRosterSize(teams[i].tid);
                    }
                };
            });
        });
    }

    function newPhaseAfterTradeDeadline(cb) {
        var phaseText;

        phaseText = g.season + " regular season, after trade deadline";
        newPhaseCb(g.PHASE.AFTER_TRADE_DEADLINE, phaseText, cb);
    }

    function newPhasePlayoffs(cb) {
        var attributes, phaseText, seasonAttributes;

        phaseText = g.season + " playoffs";

        // Set playoff matchups
        attributes = ["tid", "abbrev", "name", "cid"];
        seasonAttributes = ["winp"];
        db.getTeams(null, g.season, attributes, [], seasonAttributes, {sortBy: "winp"}, function (teams) {
            var cid, i, j, row, series, teamsConf, tidPlayoffs, tx;

            // Add entry for wins for each team; delete winp, which was only needed for sorting
            for (i = 0; i < teams.length; i++) {
                teams[i].won = 0;
            }

            tidPlayoffs = [];
            series = [[], [], [], []];  // First round, second round, third round, fourth round
            for (cid = 0; cid < 2; cid++) {
                teamsConf = [];
                for (i = 0; i < teams.length; i++) {
                    if (teams[i].cid === cid) {
                        if (teamsConf.length < 8) {
                            teamsConf.push(teams[i]);
                            tidPlayoffs.push(teams[i].tid);
                        }
                    }
                }
                series[0][cid * 4] = {home: teamsConf[0], away: teamsConf[7]};
                series[0][cid * 4].home.seed = 1;
                series[0][cid * 4].away.seed = 8;
                series[0][1 + cid * 4] = {home: teamsConf[3], away: teamsConf[4]};
                series[0][1 + cid * 4].home.seed = 4;
                series[0][1 + cid * 4].away.seed = 5;
                series[0][2 + cid * 4] = {home: teamsConf[2], away: teamsConf[5]};
                series[0][2 + cid * 4].home.seed = 3;
                series[0][2 + cid * 4].away.seed = 6;
                series[0][3 + cid * 4] = {home: teamsConf[1], away: teamsConf[6]};
                series[0][3 + cid * 4].home.seed = 2;
                series[0][3 + cid * 4].away.seed = 7;
            }

            row = {season: g.season, currentRound: 0, series: series};
            tx = g.dbl.transaction("playoffSeries", "readwrite");
            tx.objectStore("playoffSeries").add(row);
            tx.oncomplete = function () {
                var tx;
                // Add row to team stats and team season attributes
                tx = g.dbl.transaction(["players", "teams"], "readwrite");
                tx.objectStore("teams").openCursor().onsuccess = function (event) {
                    var cursor, i, key, playoffStats, t, teamSeason;

                    cursor = event.target.result;
                    if (cursor) {
                        t = cursor.value;
                        teamSeason = _.last(t.seasons);
                        if (tidPlayoffs.indexOf(t.tid) >= 0) {
                            t = team.addStatsRow(t, true);

                            teamSeason.playoffRoundsWon = 0;

                            // More hype for making the playoffs
                            teamSeason.hype += 0.05;
                            if (teamSeason.hype > 1) {
                                teamSeason.hype = 1;
                            }

                            cursor.update(t);

                            // Add row to player stats
                            tx.objectStore("players").index("tid").openCursor(t.tid).onsuccess = function (event) {
                                var cursorP, key, p, playerPlayoffStats;

                                cursorP = event.target.result;
                                if (cursorP) {
                                    p = cursorP.value;
                                    p = player.addStatsRow(p, true);
                                    cursorP.update(p);
                                    cursorP.continue();
                                }
                            };
                        } else {
                            // Less hype for missing the playoffs
                            teamSeason.hype -= 0.05;
                            if (teamSeason.hype < 0) {
                                teamSeason.hype = 0;
                            }

                            cursor.update(t);
                        }
                        cursor.continue();
                    }
                };
                tx.oncomplete = function () {
                    finances.assesPayrollMinLuxury(function () {
                        newPhaseCb(g.PHASE.PLAYOFFS, phaseText, function () {
                            if (cb !== undefined) {
                                cb();
                            }
                            Davis.location.assign(new Davis.Request("/l/" + g.lid + "/playoffs"));
                        });
                    });
                };
            };
        });
    }

    function newPhaseBeforeDraft(cb) {
        var phaseText, tx;

        phaseText = g.season + " before draft";

        // Check for retiring players
        tx = g.dbl.transaction("players", "readwrite");
        tx.objectStore("players").index("tid").openCursor(IDBKeyRange.lowerBound(g.PLAYER.RETIRED, true)).onsuccess = function (event) { // All non-retired players
            var age, cont, cursor, excessAge, excessPot, i, maxAge, minPot, p, pot, update;

            update = false;

            // Players meeting one of these cutoffs might retire
            maxAge = 34;
            minPot = 40;

            cursor = event.target.result;
            if (cursor) {
                p = cursor.value;

                age = g.season - p.born.year;
                pot = _.last(p.ratings).pot;

                if (age > maxAge || pot < minPot) {
                    excessAge = 0;
                    if (age > 34 || p.tid === g.PLAYER.FREE_AGENT) {  // Only players older than 34 or without a contract will retire
                        if (age > 34) {
                            excessAge = (age - 34) / 20;  // 0.05 for each year beyond 34
                        }
                        excessPot = (40 - pot) / 50.0;  // 0.02 for each potential rating below 40 (this can be negative)
                        if (excessAge + excessPot + random.gauss(0, 1) > 0) {
                            p.tid = g.PLAYER.RETIRED;
                            p.retiredYear = g.season;
                            update = true;
                        }
                    }
                }

                // Update "free agent years" counter and retire players who have been free agents for more than one years
                if (p.tid === g.PLAYER.FREE_AGENT) {
                    if (p.yearsFreeAgent >= 1) {
                        p.tid = g.PLAYER.RETIRED;
                        p.retiredYear = g.season;
                    } else {
                        p.yearsFreeAgent += 1;
                    }
                    p.contract.exp += 1;
                    update = true;
                } else if (p.tid >= 0 && p.yearsFreeAgent > 0) {
                    p.yearsFreeAgent = 0;
                    update = true;
                }

                // Heal injures
                if (p.injury.type !== "Healthy") {
                    if (p.injury.gamesRemaining <= 82) {
                        p.injury = {type: "Healthy", gamesRemaining: 0};
                    } else {
                        p.injury.gamesRemaining -= 82;
                    }
                    update = true;
                }

                // Update player in DB, if necessary
                if (update) {
                    cursor.update(p);
                }
                cursor.continue();
            }
        };
        tx.oncomplete = function () {
            var releasedPlayersStore, tx;

            // Remove released players' salaries from payrolls if their contract expired this year
            tx = g.dbl.transaction("releasedPlayers", "readwrite");
            releasedPlayersStore = tx.objectStore("releasedPlayers");
            releasedPlayersStore.index("contract.exp").getAll(IDBKeyRange.upperBound(g.season)).onsuccess = function (event) {
                var i, releasedPlayers;

                releasedPlayers = event.target.result;

                for (i = 0; i < releasedPlayers.length; i++) {
                    releasedPlayersStore.delete(releasedPlayers[i].rid);
                }
            };
            tx.oncomplete = function () {
                // Select winners of the season's awards
                // This needs to be inside the callback because of Firefox bug 763915
                awards(function () {
                    newPhaseCb(g.PHASE.BEFORE_DRAFT, phaseText, function () {
                        if (cb !== undefined) {
                            cb();
                        }
                        Davis.location.assign(new Davis.Request("/l/" + g.lid + "/history"));

                        helpers.bbgmPing("season");
                    });
                });
            };
        };
    }

    function newPhaseDraft(cb) {
        var phaseText;

        phaseText = g.season + " draft";
        newPhaseCb(g.PHASE.DRAFT, phaseText, cb);
    }

    function newPhaseAfterDraft(cb) {
        var phaseText;

        phaseText = g.season + " after draft";
        newPhaseCb(g.PHASE.AFTER_DRAFT, phaseText, cb, true);
    }

    function newPhaseResignPlayers(cb) {
        var phaseText, transaction;

        phaseText = g.season + " resign players";

        transaction = g.dbl.transaction(["gameAttributes", "messages", "negotiations", "players", "teams"], "readwrite");

        player.genBaseMoods(transaction, function (baseMoods) {
            var playerStore;

            playerStore = transaction.objectStore("players");

            // Resign players or they become free agents
            playerStore.index("tid").openCursor(IDBKeyRange.lowerBound(0)).onsuccess = function (event) {
                var contract, cursor, i, p;

                cursor = event.target.result;
                if (cursor) {
                    p = cursor.value;
                    if (p.contract.exp <= g.season) {
                        if (p.tid !== g.userTid) {
                            // Automatically negotiate with teams
                            if (Math.random() < _.last(p.ratings).ovr / 100) { // Should eventually be smarter than a coin flip
                                p = player.setContract(p, player.genContract(_.last(p.ratings)), true);
                                cursor.update(p); // Other endpoints include calls to addToFreeAgents, which handles updating the database
                            } else {
                                player.addToFreeAgents(playerStore, p, g.PHASE.RESIGN_PLAYERS, baseMoods);
                            }
                        } else {
                            // Add to free agents first, to generate a contract demand
                            player.addToFreeAgents(playerStore, p, g.PHASE.RESIGN_PLAYERS, baseMoods, function () {
                                // Open negotiations with player
                                contractNegotiation.create(transaction, p.pid, true, function (error) {
                                    if (error !== undefined && error) {
                                        return helpers.error(error);
                                    }
                                });
                            });
                        }
                    }
                    cursor.continue();
                } else {
                    newPhaseCb(g.PHASE.RESIGN_PLAYERS, phaseText, function () {
                        if (cb !== undefined) {
                            cb();
                        }
                        Davis.location.assign(new Davis.Request("/l/" + g.lid + "/negotiation"));
                    });
                }
            };
        });
    }

    function newPhaseFreeAgency(cb) {
        var phaseText;

        phaseText = g.season + " free agency";

        // Delete all current negotiations to resign players
        contractNegotiation.cancelAll(function () {
            var playerStore, tx;

            tx = g.dbl.transaction(["players", "teams"], "readwrite");
            player.genBaseMoods(tx, function (baseMoods) {
                playerStore = tx.objectStore("players");

                // Reset contract demands of current free agents
                // This IDBKeyRange only works because g.PLAYER.UNDRAFTED is -2 and g.PLAYER.FREE_AGENT is -1
                playerStore.index("tid").openCursor(IDBKeyRange.bound(g.PLAYER.UNDRAFTED, g.PLAYER.FREE_AGENT)).onsuccess = function (event) {
                    var cursor, p;

                    cursor = event.target.result;
                    if (cursor) {
                        p = cursor.value;
                        player.addToFreeAgents(playerStore, p, g.PHASE.FREE_AGENCY, baseMoods);
//                        cursor.update(p);
                        cursor.continue();
                    }
                };
                tx.oncomplete = function () {
                    newPhaseCb(g.PHASE.FREE_AGENCY, phaseText, function () {
                        if (cb !== undefined) {
                            cb();
                        }
                        Davis.location.assign(new Davis.Request("/l/" + g.lid + "/free_agents"));
                    });
                };
            });
        });
    }

    /**
     * Set a new phase of the game.
     *
     * This function is called to do all the crap that must be done during transitions between phases of the game, such as moving from the regular season to the playoffs. Phases are defined in the g.PHASE.* global variables. The phase update may happen asynchronously if the database must be accessed, so do not rely on g.phase being updated immediately after this function is called. Instead, pass a callback.
     * 
     * @memberOf core.season
     * @param {number} phase Numeric phase ID. This should always be one of the g.PHASE.* variables defined in globals.js.
     * @param {function()=} cb Optional callback run after the phase change is completed.
     */
    function newPhase(phase, cb) {
        var playButtonElement;

        // Prevent code running twice
        if (phase === g.phase) {
            return;
        }

        // Prevent new phase from being clicked twice by deleting all options from the play menu. The options will be restored after the new phase is set or if there is an error by calling ui.updatePlayMenu.
        playButtonElement = document.getElementById("playButton");
        if (playButtonElement) {
            playButtonElement.innerHTML = Handlebars.templates.playButton({options: []});
        }

        if (phase === g.PHASE.PRESEASON) {
            newPhasePreseason(cb);
        } else if (phase === g.PHASE.REGULAR_SEASON) {
            newPhaseRegularSeason(cb);
        } else if (phase === g.PHASE.AFTER_TRADE_DEADLINE) {
            newPhaseAfterTradeDeadline(cb);
        } else if (phase === g.PHASE.PLAYOFFS) {
            newPhasePlayoffs(cb);
        } else if (phase === g.PHASE.BEFORE_DRAFT) {
            newPhaseBeforeDraft(cb);
        } else if (phase === g.PHASE.DRAFT) {
            newPhaseDraft(cb);
        } else if (phase === g.PHASE.AFTER_DRAFT) {
            newPhaseAfterDraft(cb);
        } else if (phase === g.PHASE.RESIGN_PLAYERS) {
            newPhaseResignPlayers(cb);
        } else if (phase === g.PHASE.FREE_AGENCY) {
            newPhaseFreeAgency(cb);
        }
    }

    /*Creates a single day's schedule for an in-progress playoffs.*/
    function newSchedulePlayoffsDay(cb) {
        var tx;

        tx = g.dbl.transaction(["playoffSeries", "teams"], "readwrite");

        // Make today's  playoff schedule
        tx.objectStore("playoffSeries").openCursor(g.season).onsuccess = function (event) {
            var cursor, i, matchup, nextRound, numGames, playoffSeries, rnd, series, team1, team2, tids, tidsWon;

            cursor = event.target.result;
            playoffSeries = cursor.value;
            series = playoffSeries.series;
            rnd = playoffSeries.currentRound;
            tids = [];

            for (i = 0; i < series[rnd].length; i++) {
                if (series[rnd][i].home.won < 4 && series[rnd][i].away.won < 4) {
                    // Make sure to set home/away teams correctly! Home for the lower seed is 1st, 2nd, 5th, and 7th games.
                    numGames = series[rnd][i].home.won + series[rnd][i].away.won;
                    if (numGames === 0 || numGames === 1 || numGames === 4 || numGames === 6) {
                        tids.push([series[rnd][i].home.tid, series[rnd][i].away.tid]);
                    } else {
                        tids.push([series[rnd][i].away.tid, series[rnd][i].home.tid]);
                    }
                }
            }
            if (tids.length > 0) {
                setSchedule(tids, function () { cb(); });
            } else {
                // The previous round is over. Either make a new round or go to the next phase.

                // Record who won the league or conference championship
                if (rnd === 3) {
                    tx.objectStore("teams").openCursor(series[rnd][0].home.tid).onsuccess = function (event) {
                        var cursor, t, teamSeason;

                        cursor = event.target.result;
                        t = cursor.value;
                        teamSeason = _.last(t.seasons);
                        if (series[rnd][0].home.won === 4) {
                            teamSeason.playoffRoundsWon += 1;
                            teamSeason.hype += 0.05;
                            if (teamSeason.hype > 1) {
                                teamSeason.hype = 1;
                            }
                        }
                        cursor.update(t);
                    };
                    tx.objectStore("teams").openCursor(series[rnd][0].away.tid).onsuccess = function (event) {
                        var cursor, t, teamSeason;

                        cursor = event.target.result;
                        t = cursor.value;
                        teamSeason = _.last(t.seasons);
                        if (series[rnd][0].away.won === 4) {
                            teamSeason.playoffRoundsWon += 1;
                            teamSeason.hype += 0.1;
                            if (teamSeason.hype > 1) {
                                teamSeason.hype = 1;
                            }
                        }
                        cursor.update(t);
                    };
                    tx.oncomplete = function () {
                        newPhase(g.PHASE.BEFORE_DRAFT, cb);
                    };
                } else {
                    nextRound = [];
                    tidsWon = [];
                    for (i = 0; i < series[rnd].length; i += 2) {
                        // Find the two winning teams
                        if (series[rnd][i].home.won === 4) {
                            team1 = helpers.deepCopy(series[rnd][i].home);
                            tidsWon.push(series[rnd][i].home.tid);
                        } else {
                            team1 = helpers.deepCopy(series[rnd][i].away);
                            tidsWon.push(series[rnd][i].away.tid);
                        }
                        if (series[rnd][i + 1].home.won === 4) {
                            team2 = helpers.deepCopy(series[rnd][i + 1].home);
                            tidsWon.push(series[rnd][i + 1].home.tid);
                        } else {
                            team2 = helpers.deepCopy(series[rnd][i + 1].away);
                            tidsWon.push(series[rnd][i + 1].away.tid);
                        }

                        // Set home/away in the next round
                        if (team1.winp > team2.winp) {
                            matchup = {home: team1, away: team2};
                        } else {
                            matchup = {home: team2, away: team1};
                        }

                        matchup.home.won = 0;
                        matchup.away.won = 0;
                        series[rnd + 1][i / 2] = matchup;
                    }
                    playoffSeries.currentRound += 1;
                    cursor.update(playoffSeries);

                    // Update hype for winning a series
                    for (i = 0; i < tidsWon.length; i++) {
                        tx.objectStore("teams").openCursor(tidsWon[i]).onsuccess = function (event) {
                            var cursor, t, teamSeason;

                            cursor = event.target.result;
                            t = cursor.value;
                            teamSeason = _.last(t.seasons);
                            teamSeason.playoffRoundsWon += 1;
                            teamSeason.hype += 0.05;
                            if (teamSeason.hype > 1) {
                                teamSeason.hype = 1;
                            }
                            cursor.update(t);
                        };
                    }

                    tx.oncomplete = function () {
                        cb();
                    };
                }
            }
        };
    }

    /**
     * Get an array of games from the schedule.
     * 
     * @memberOf core.season
     * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction on schedule; if null is passed, then a new transaction will be used.
     * @param {number} numDays Number of days of games requested. Currently, this will return all games if 0 is passed or one day of games if any number greater than 0 is passed.
     * @param {function(Array)} cb Callback function that takes the requested schedule array as its only argument.
     */
    function getSchedule(ot, numDays, cb) {
        var scheduleStore;

        numDays = Math.floor(numDays);

        scheduleStore = db.getObjectStore(ot, "schedule", "schedule");
        scheduleStore.getAll().onsuccess = function (event) {
            var i, schedule, tids;

            schedule = event.target.result;
            if (numDays > 0) {
                schedule = schedule.slice(0, g.numTeams / 2);  // This is the maximum number of games possible in a day

                // Only take the games up until right before a team plays for the second time that day
                tids = [];
                for (i = 0; i < schedule.length; i++) {
                    if (tids.indexOf(schedule[i].homeTid) < 0 && tids.indexOf(schedule[i].awayTid) < 0) {
                        tids.push(schedule[i].homeTid);
                        tids.push(schedule[i].awayTid);
                    } else {
                        break;
                    }
                }
                schedule = schedule.slice(0, i);
            }
            cb(schedule);
        };
    }

    return {
        newPhase: newPhase,
        newSchedule: newSchedule,
        newSchedulePlayoffsDay: newSchedulePlayoffsDay,
        setSchedule: setSchedule,
        getSchedule: getSchedule
    };
});