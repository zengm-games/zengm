/**
 * @name core.season
 * @namespace Somewhat of a hodgepodge. Basically, this is for anything related to a single season that doesn't deserve to be broken out into its own file. Currently, this includes things that happen when moving between phases of the season (i.e. regular season to playoffs) and scheduling. As I write this, I realize that it might make more sense to break up those two classes of functions into two separate modules, but oh well.
 */
define(["db", "ui", "core/contractNegotiation", "core/freeAgents", "core/player", "util/helpers", "util/random"], function (db, ui, contractNegotiation, freeAgents, player, helpers, random) {
    "use strict";

    /**
     * Compute the awards (MVP, etc) after a season finishes.
     *
     * The awards are saved to the "awards" object store.
     *
     * @memberOf core.season
     * @param {function()} cb Callback function run after the database operations finish.
     */
    function awards(cb) {
        var transaction;

        transaction = g.dbl.transaction(["players", "releasedPlayers", "teams"]);

        // Any non-retired player can win an award
        transaction.objectStore("players").index("tid").getAll(IDBKeyRange.lowerBound(c.PLAYER_RETIRED, true)).onsuccess = function (event) {
            var attributes, awards, i, p, players, ratings, seasonAttributes, stats;

            awards = {season: g.season};

            attributes = ["pid", "name", "tid", "abbrev", "draftYear"];
            stats = ["gp", "gs", "min", "pts", "trb", "ast", "blk", "stl"];
            ratings = [];
            players = db.getPlayers(event.target.result, g.season, null, attributes, stats, ratings);

            // Most Valuable Player
            players.sort(function (a, b) {  return (0.75 * b.stats.pts + b.stats.ast + b.stats.trb) - (0.75 * a.stats.pts + a.stats.ast + a.stats.trb); });
            p = players[0];
            awards.mvp = {pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, pts: p.stats.pts, trb: p.stats.trb, ast: p.stats.ast};

            // Sixth Man of the Year - same sort as MVP
            for (i = 0; i < players.length; i++) {
                // Must have come off the bench in most games
                if (players[i].stats.gs === 0 || players[i].stats.gp / players[i].stats.gs > 2) {
                    break;
                }
            }
            p = players[i];
            awards.smoy = {pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, pts: p.stats.pts, trb: p.stats.trb, ast: p.stats.ast};

            // Rookie of the Year - same sort as MVP
            for (i = 0; i < players.length; i++) {
                // This doesn't factor in players who didn't start playing right after being drafted, because currently that doesn't really happen in the game.
                if (players[i].draftYear === g.season - 1) {
                    break;
                }
            }
            p = players[i];
            if (p !== undefined) { // I suppose there could be no rookies at all..
                awards.roy = {pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, pts: p.stats.pts, trb: p.stats.trb, ast: p.stats.ast};
            }

            // All League Team - same sort as MVP
            awards.allLeague = [{title: "First Team", players: []}];
            for (i = 0; i < 15; i++) {
                p = players[i];
                if (i === 5) {
                    awards.allLeague.push({title: "Second Team", players: []});
                } else if (i === 10) {
                    awards.allLeague.push({title: "Third Team", players: []});
                }
                _.last(awards.allLeague).players.push({pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, pts: p.stats.pts, trb: p.stats.trb, ast: p.stats.ast});
            }

            // Defensive Player of the Year
            players.sort(function (a, b) {  return (b.stats.trb + 5 * b.stats.blk + 5 * b.stats.stl) - (a.stats.trb + 5 * a.stats.blk + 5 * a.stats.stl); });
            p = players[0];
            awards.dpoy = {pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, trb: p.stats.trb, blk: p.stats.blk, stl: p.stats.stl};

            // All Defensive Team - same sort as DPOY
            awards.allDefensive = [{title: "First Team", players: []}];
            for (i = 0; i < 15; i++) {
                p = players[i];
                if (i === 5) {
                    awards.allDefensive.push({title: "Second Team", players: []});
                } else if (i === 10) {
                    awards.allDefensive.push({title: "Third Team", players: []});
                }
                _.last(awards.allDefensive).players.push({pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, trb: p.stats.trb, blk: p.stats.blk, stl: p.stats.stl});
            }

            attributes = ["tid", "abbrev", "region", "name", "cid"];
            stats = [];
            seasonAttributes = ["won", "lost", "winp"];
            db.getTeams(transaction, g.season, attributes, stats, seasonAttributes, {sortBy: "winp"}, function (teams) {
                var i, foundEast, foundWest, t;

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
                g.dbl.transaction("awards", "readwrite").objectStore("awards").add(awards);

                cb();
            });
        };
    }

    /**
     * Creates a new regular season schedule.
     *
     * This makes an NBA-like schedule in terms of conference matchups, division matchups, and home/away games.
     * 
     * @memberOf core.season
     * @param {function(Array)} cb Callback to run after the schedule is generated. The argument is a list of all the season's games, where each entry in the list is a list of the home team ID and the away team ID.
     */
    function newSchedule(cb) {
        helpers.getTeams(undefined, function (teamsAll) {
            var cid, days, dids, game, games, good, i, ii, iters, j, jj, jMax, k, matchup, matchups, n, newMatchup, t, team, teams, tids, tidsByConf, tidsInDays, tryNum, used;

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
            cb(tids);
        });
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
        helpers.getTeams(undefined, function (teams) {
            var i, row, schedule, scheduleStore;

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
            scheduleStore = g.dbl.transaction(["schedule"], "readwrite").objectStore("schedule");
            scheduleStore.getAll().onsuccess = function (event) {
                var currentSchedule, i;

                currentSchedule = event.target.result;
                for (i = 0; i < currentSchedule.length; i++) {
                    scheduleStore.delete(currentSchedule[i].gid);
                }

                for (i = 0; i < schedule.length; i++) {
                    scheduleStore.add(schedule[i]);
                }

                cb();
            };
        });
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
            var phaseText, transaction;

            phaseText = g.season + " preseason";

            transaction = g.dbl.transaction(["players", "teams"], "readwrite");

            // Add row to team stats and season attributes
            transaction.objectStore("teams").openCursor().onsuccess = function (event) {
                var cursor, key, team, teamNewSeason, teamNewStats, teamSeason;

                cursor = event.target.result;
                if (cursor) {
                    team = cursor.value;

                    teamSeason = team.seasons[team.seasons.length - 1]; // Previous season
                    teamNewSeason = helpers.deepCopy(teamSeason);
                    // Reset everything except cash. Cash rolls over.
                    teamNewSeason.season = g.season;
                    teamNewSeason.gp = 0;
                    teamNewSeason.att = 0;
                    teamNewSeason.revenue = 0;
                    teamNewSeason.cost = 0;
                    teamNewSeason.won = 0;
                    teamNewSeason.lost = 0;
                    teamNewSeason.wonHome = 0;
                    teamNewSeason.lostHome = 0;
                    teamNewSeason.wonAway = 0;
                    teamNewSeason.lostAway = 0;
                    teamNewSeason.wonDiv = 0;
                    teamNewSeason.lostDiv = 0;
                    teamNewSeason.wonConf = 0;
                    teamNewSeason.lostConf = 0;
                    teamNewSeason.lastTen = [];
                    teamNewSeason.streak = 0;
                    teamNewSeason.madePlayoffs = false;
                    teamNewSeason.confChamps = false;
                    teamNewSeason.leagueChamps = false;
                    team.seasons.push(teamNewSeason);

                    teamNewStats = {};
                    // Copy new stats from any season and set to 0 (this works - see core.league.new)
                    for (key in team.stats[0]) {
                        if (team.stats[0].hasOwnProperty(key)) {
                            teamNewStats[key] = 0;
                        }
                    }
                    teamNewStats.season = g.season;
                    teamNewStats.playoffs = false;
                    team.stats.push(teamNewStats);

                    cursor.update(team);
                    cursor.continue();
                } else {
                    // Loop through all non-retired players
                    transaction.objectStore("players").index("tid").openCursor(IDBKeyRange.lowerBound(c.PLAYER_RETIRED, true)).onsuccess = function (event) {
                        var cursorP, p;

                        cursorP = event.target.result;
                        if (cursorP) {
                            p = cursorP.value;

                            // Update ratings
                            p = player.addRatingsRow(p);
                            p = player.develop(p);

                            // Add row to player stats if they are on a team
                            if (p.tid >= 0) {
                                p = player.addStatsRow(p);
                            }

                            cursorP.update(p);
                            cursorP.continue();
                        } else {
                            // AI teams sign free agents
                            freeAgents.autoSign(function () {
                                newPhaseCb(c.PHASE_PRESEASON, phaseText, cb, true);
                            });
                        }
                    };
                }
            };
        });
    }

    function newPhaseRegularSeason(cb) {
        var checkRosterSize, done, phaseText, playerStore, transaction, userTeamSizeError;

        phaseText = g.season + " regular season";

        transaction = g.dbl.transaction(["players", "releasedPlayers", "teams"], "readwrite");
        playerStore = transaction.objectStore("players");

        done = 0;
        userTeamSizeError = false;
        checkRosterSize = function (tid) {
            playerStore.index("tid").getAll(tid).onsuccess = function (event) {
                var i, numPlayersOnRoster, players, playersAll;

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
                    newSchedule(function (tids) {
                        // 4th parameter of newPhaseCb will reload the page when true. Don't do this if this is the first season, as that means the new league menu is still displayed (probably) and views.newLeague will handle a redirect to the league dashboard.
                        setSchedule(tids, function () { newPhaseCb(c.PHASE_REGULAR_SEASON, phaseText, cb, g.season !== g.startingSeason); });
                    });

                    // Auto sort rosters (except player's team)
                    for (tid = 0; tid < g.numTeams; tid++) {
                        if (tid !== g.userTid) {
                            db.rosterAutoSort(playerStore, tid);
                        }
                    }
                }
            };
        };

        // First, make sure teams are all within the roster limits
        // CPU teams
        transaction.objectStore("teams").getAll().onsuccess = function (event) {
            var i, teams;

            teams = event.target.result;
            for (i = 0; i < teams.length; i++) {
                checkRosterSize(teams[i].tid);
            }
        };
    }

    function newPhaseAfterTradeDeadline(cb) {
        var phaseText;

        phaseText = g.season + " regular season, after trade deadline";
        newPhaseCb(c.PHASE_AFTER_TRADE_DEADLINE, phaseText, cb);
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
                delete teams[i].winp;
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
            g.dbl.transaction("playoffSeries", "readwrite").objectStore("playoffSeries").add(row);

            // Add row to team stats and team season attributes
            tx = g.dbl.transaction(["players", "teams"], "readwrite");
            tx.objectStore("teams").openCursor().onsuccess = function (event) {
                var cursor, i, key, playoffStats, seasonStats, t;

                cursor = event.target.result;
                if (cursor) {
                    t = cursor.value;
                    if (tidPlayoffs.indexOf(t.tid) >= 0) {
                        for (i = 0; i < t.stats.length; i++) {
                            if (t.stats[i].season === g.season) {
                                seasonStats = t.stats[i];
                                break;
                            }
                        }
                        playoffStats = {};
                        for (key in seasonStats) {
                            if (seasonStats.hasOwnProperty(key)) {
                                playoffStats[key] = 0;
                            }
                        }
                        playoffStats.season = g.season;
                        playoffStats.playoffs = true;
                        t.stats.push(playoffStats);
                        _.last(t.seasons).madePlayoffs = true;
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
                    }
                    cursor.continue();
                }
            };
            tx.oncomplete = function () {
                newPhaseCb(c.PHASE_PLAYOFFS, phaseText, function () {
                    if (cb !== undefined) {
                        cb();
                    }
                    Davis.location.assign(new Davis.Request("/l/" + g.lid + "/playoffs"));
                });
            };
        });
    }

    function newPhaseBeforeDraft(cb) {
        var phaseText, releasedPlayersStore;

        phaseText = g.season + " before draft";

        // Check for retiring players
        g.dbl.transaction("players", "readwrite").objectStore("players").index("tid").openCursor(IDBKeyRange.lowerBound(c.PLAYER_RETIRED, true)).onsuccess = function (event) { // All non-retired players
            var age, cont, cursor, excessAge, excessPot, i, maxAge, minPot, p, pot, update;

            update = false;

            // Players meeting one of these cutoffs might retire
            maxAge = 34;
            minPot = 40;

            cursor = event.target.result;
            if (cursor) {
                p = cursor.value;

                age = g.season - p.bornYear;
                pot = _.last(p.ratings).pot;

                if (age > maxAge || pot < minPot) {
                    excessAge = 0;
                    if (age > 34 || p.tid === c.PLAYER_FREE_AGENT) {  // Only players older than 34 or without a contract will retire
                        if (age > 34) {
                            excessAge = (age - 34) / 20;  // 0.05 for each year beyond 34
                        }
                        excessPot = (40 - pot) / 50.0;  // 0.02 for each potential rating below 40 (this can be negative)
                        if (excessAge + excessPot + random.gauss(0, 1) > 0) {
                            p.tid = c.PLAYER_RETIRED;
                            p.retiredYear = g.season;
                            update = true;
                        }
                    }
                }

                // Update "free agent years" counter and retire players who have been free agents for more than one years
                if (p.tid === c.PLAYER_FREE_AGENT) {
                    if (p.yearsFreeAgent >= 1) {
                        p.tid = c.PLAYER_RETIRED;
                        p.retiredYear = g.season;
                    } else {
                        p.yearsFreeAgent += 1;
                    }
                    p.contractExp += 1;
                    update = true;
                } else if (p.tid >= 0 && p.yearsFreeAgent > 0) {
                    p.yearsFreeAgent = 0;
                    update = true;
                }

                // Update player in DB, if necessary
                if (update) {
                    cursor.update(p);
                }
                cursor.continue();
            } else {
                // Remove released players' salaries from payrolls
                releasedPlayersStore = g.dbl.transaction("releasedPlayers", "readwrite").objectStore("releasedPlayers");
                releasedPlayersStore.index("contractExp").getAll(g.season).onsuccess = function (event) {
                    var i, releasedPlayers;

                    releasedPlayers = event.target.result;

                    for (i = 0; i < releasedPlayers.length; i++) {
                        releasedPlayersStore.delete(releasedPlayers[i].rid);
                    }

                    // Select winners of the season's awards
                    // This needs to be inside the callback because of Firefox bug 763915
                    awards(function () {
                        newPhaseCb(c.PHASE_BEFORE_DRAFT, phaseText, function () {
                            if (cb !== undefined) {
                                cb();
                            }
                            Davis.location.assign(new Davis.Request("/l/" + g.lid + "/history"));
                        });
                    });
                };
            }
        };
    }

    function newPhaseDraft(cb) {
        var phaseText;

        phaseText = g.season + " draft";
        newPhaseCb(c.PHASE_DRAFT, phaseText, cb);
    }

    function newPhaseAfterDraft(cb) {
        var phaseText;

        phaseText = g.season + " after draft";
        newPhaseCb(c.PHASE_AFTER_DRAFT, phaseText, cb, true);
    }

    function newPhaseResignPlayers(cb) {
        var phaseText, playerStore, transaction;

        phaseText = g.season + " resign players";

        transaction = g.dbl.transaction(["gameAttributes", "negotiations", "players"], "readwrite");
        playerStore = transaction.objectStore("players");

        // Resign players or they become free agents
        playerStore.index("tid").openCursor(IDBKeyRange.lowerBound(0)).onsuccess = function (event) {
            var cont, cursor, i, p;

            cursor = event.target.result;
            if (cursor) {
                p = cursor.value;
                if (p.contractExp === g.season) {
                    if (p.tid !== g.userTid) {
                        // Automatically negotiate with teams
                        if (Math.random() > 0.5) { // Should eventually be smarter than a coin flip
                            cont = player.contract(_.last(p.ratings));
                            p.contractAmount = cont.amount;
                            p.contractExp = cont.exp;
                            cursor.update(p); // Other endpoints include calls to addToFreeAgents, which handles updating the database
                        } else {
                            player.addToFreeAgents(playerStore, p, c.PHASE_RESIGN_PLAYERS);
                        }
                    } else {
                        // Add to free agents first, to generate a contract demand
                        player.addToFreeAgents(playerStore, p, c.PHASE_RESIGN_PLAYERS, function () {
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
                newPhaseCb(c.PHASE_RESIGN_PLAYERS, phaseText, function () {
                    if (cb !== undefined) {
                        cb();
                    }
                    Davis.location.assign(new Davis.Request("/l/" + g.lid + "/negotiation"));
                });
            }
        };
    }

    function newPhaseFreeAgency(cb) {
        var phaseText, playerStore;

        phaseText = g.season + " free agency";

        // Delete all current negotiations to resign players
        contractNegotiation.cancelAll(function () {
            playerStore = g.dbl.transaction(["players"], "readwrite").objectStore("players");

            // Reset contract demands of current free agents
            // This IDBKeyRange only works because c.PLAYER_UNDRAFTED is -2 and c.PLAYER_FREE_AGENT is -1
            playerStore.index("tid").openCursor(IDBKeyRange.bound(c.PLAYER_UNDRAFTED, c.PLAYER_FREE_AGENT)).onsuccess = function (event) {
                var cursor, p;

                cursor = event.target.result;
                if (cursor) {
                    p = cursor.value;
                    player.addToFreeAgents(playerStore, p, c.PHASE_FREE_AGENCY);
                    cursor.update(p);
                    cursor.continue();
                } else {
                    newPhaseCb(c.PHASE_FREE_AGENCY, phaseText, function () {
                        if (cb !== undefined) {
                            cb();
                        }
                        Davis.location.assign(new Davis.Request("/l/" + g.lid + "/free_agents"));
                    });
                }
            };
        });
    }

    /**
     * Set a new phase of the game.
     *
     * This function is called to do all the crap that must be done during transitions between phases of the game, such as moving from the regular season to the playoffs. Phases are defined in the c.PHASE_* global variables. The phase update may happen asynchronously if the database must be accessed, so do not rely on g.phase being updated immediately after this function is called. Instead, pass a callback.
     * 
     * @memberOf core.season
     * @param {number} phase Numeric phase ID. This should always be one of the c.PHASE_* variables defined in globals.js.
     * @param {function()=} cb Optional callback run after the phase change is completed.
     */
    function newPhase(phase, cb) {
        var button, playButtonElement;

        // Prevent code running twice
        if (phase === g.phase) {
            return;
        }

        // Prevent new phase from being clicked twice by deleting all options from the play menu. The options will be restored after the new phase is set or if there is an error by calling ui.updatePlayMenu.
        button = Handlebars.templates.playButton({options: []});
        playButtonElement = document.getElementById("playButton");
        if (playButtonElement) {
            playButtonElement.innerHTML = button;
        }

        if (phase === c.PHASE_PRESEASON) {
            newPhasePreseason(cb);
        } else if (phase === c.PHASE_REGULAR_SEASON) {
            newPhaseRegularSeason(cb);
        } else if (phase === c.PHASE_AFTER_TRADE_DEADLINE) {
            newPhaseAfterTradeDeadline(cb);
        } else if (phase === c.PHASE_PLAYOFFS) {
            newPhasePlayoffs(cb);
        } else if (phase === c.PHASE_BEFORE_DRAFT) {
            newPhaseBeforeDraft(cb);
        } else if (phase === c.PHASE_DRAFT) {
            newPhaseDraft(cb);
        } else if (phase === c.PHASE_AFTER_DRAFT) {
            newPhaseAfterDraft(cb);
        } else if (phase === c.PHASE_RESIGN_PLAYERS) {
            newPhaseResignPlayers(cb);
        } else if (phase === c.PHASE_FREE_AGENCY) {
            newPhaseFreeAgency(cb);
        }
    }

    /*Creates a single day's schedule for an in-progress playoffs.*/
    function newSchedulePlayoffsDay(cb) {
        var transaction;

        transaction = g.dbl.transaction(["playoffSeries", "teams"], "readwrite");

        // Make today's  playoff schedule
        transaction.objectStore("playoffSeries").openCursor(g.season).onsuccess = function (event) {
            var cursor, i, matchup, nextRound, playoffSeries, rnd, series, tids, winners;

            cursor = event.target.result;
            playoffSeries = cursor.value;
            series = playoffSeries.series;
            rnd = playoffSeries.currentRound;
            tids = [];

            for (i = 0; i < series[rnd].length; i++) {
                if (series[rnd][i].home.won < 4 && series[rnd][i].away.won < 4) {
                    tids.push([series[rnd][i].home.tid, series[rnd][i].away.tid]);
                }
            }
            if (tids.length > 0) {
                setSchedule(tids, function () { cb(); });
            } else {
                // The previous round is over. Either make a new round or go to the next phase.

                // Record who won the league or conference championship
                if (rnd === 3) {
                    transaction.objectStore("teams").openCursor(series[rnd][0].home.tid).onsuccess = function (event) {
                        var cursor, t;

                        cursor = event.target.result;
                        t = cursor.value;
                        _.last(t.seasons).confChamps = true;
                        if (series[rnd][0].home.won === 4) {
                            _.last(t.seasons).leagueChamps = true;
                        }
                        cursor.update(t);
                    };
                    transaction.objectStore("teams").openCursor(series[rnd][0].away.tid).onsuccess = function (event) {
                        var cursor, t;

                        cursor = event.target.result;
                        t = cursor.value;
                        _.last(t.seasons).confChamps = true;
                        if (series[rnd][0].away.won === 4) {
                            _.last(t.seasons).leagueChamps = true;
                        }
                        cursor.update(t);
                    };
                }

                // Are the whole playoffs over?
                if (rnd === 3) {
                    newPhase(c.PHASE_BEFORE_DRAFT, cb);
                } else {
                    nextRound = [];
                    for (i = 0; i < series[rnd].length; i += 2) {
                        matchup = {home: {}, away: {}};
                        if (series[rnd][i].home.won === 4) {
                            matchup.home = helpers.deepCopy(series[rnd][i].home);
                        } else {
                            matchup.home = helpers.deepCopy(series[rnd][i].away);
                        }
                        if (series[rnd][i + 1].home.won === 4) {
                            matchup.away = helpers.deepCopy(series[rnd][i + 1].home);
                        } else {
                            matchup.away = helpers.deepCopy(series[rnd][i + 1].away);
                        }
                        matchup.home.won = 0;
                        matchup.away.won = 0;
                        series[rnd + 1][i / 2] = matchup;
                    }
                    playoffSeries.currentRound += 1;
                    cursor.update(playoffSeries);

                    cb();
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