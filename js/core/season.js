define(["db", "core/contractNegotiation", "core/freeAgents", "core/player", "util/helpers", "util/playMenu", "util/random"], function (db, contractNegotiation, freeAgents, player, helpers, playMenu, random) {
    "use strict";

    // This should be called after the phase-specific stuff runs. It needs to be a separate function like this to play nice with async stuff.
    function newPhaseCb(phase, phaseText) {
        helpers.setGameAttributes({phase: phase});
        playMenu.setPhase(phaseText);
        playMenu.refreshOptions();
    }

    function newPhasePreseason() {
        var phaseText, transaction;

        helpers.setGameAttributes({season: g.season + 1});
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
                teamNewSeason.att = 0;
                teamNewSeason.cost = 0;
                teamNewSeason.won = 0;
                teamNewSeason.lost = 0;
                teamNewSeason.wonDiv = 0;
                teamNewSeason.lostDiv = 0;
                teamNewSeason.wonConf = 0;
                teamNewSeason.lostConf = 0;
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
                            newPhaseCb(c.PHASE_PRESEASON, phaseText);
                        });
                    }
                };
            }
        };
    }

    function newPhaseRegularSeason() {
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
                    } else {
                        // Should auto-add players
                    }
                }

                done += 1;
                if (done === g.numTeams && !userTeamSizeError) {
                    newSchedule(function (tids) { 
                        setSchedule(tids, function () { newPhaseCb(c.PHASE_REGULAR_SEASON, phaseText); });
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

    function newPhaseAfterTradeDeadline() {
        var phaseText;

        phaseText = g.season + " regular season, after trade deadline";
        newPhaseCb(c.PHASE_AFTER_TRADE_DEADLINE, phaseText);
    }

    function newPhasePlayoffs() {
        var attributes, phaseText, seasonAttributes;

        phaseText = g.season + " playoffs";

        // Set playoff matchups
        attributes = ["tid", "abbrev", "name", "cid"];
        seasonAttributes = ["winp"];
        db.getTeams(null, g.season, attributes, [], seasonAttributes, "winp", function (teams) {
            var cid, i, j, row, series, teamsConf, tidPlayoffs;

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
            g.dbl.transaction(["playoffSeries"], "readwrite").objectStore("playoffSeries").add(row);

            // Add row to team stats and team season attributes
            g.dbl.transaction(["teams"], "readwrite").objectStore("teams").openCursor().onsuccess = function (event) {
                var cursor, i, key, playoffStats, seasonStats, team;

                cursor = event.target.result;
                if (cursor) {
                    team = cursor.value;
                    if (tidPlayoffs.indexOf(team.tid) >= 0) {
                        for (i = 0; i < team.stats.length; i++) {
                            if (team.stats[i].season === g.season) {
                                seasonStats = team.stats[i];
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
                        team.stats.push(playoffStats);
                        cursor.update(team);

                        // Add row to player stats
                        g.dbl.transaction(["players"], "readwrite").objectStore("players").index("tid").openCursor(team.tid).onsuccess = function (event) {
                            var cursorP, key, p, playerPlayoffStats;

                            cursorP = event.target.result;
                            if (cursorP) {
                                p = cursorP.value;
                                p = player.addStatsRow(p, true);
                                cursorP.update(p);
                                cursorP.continue();
                            }
//                                else {
//                                    cursor.continue();
//                                }
                        };
                    }
//                        else {
// RACE CONDITION: Should only run after the players update above finishes. won't be a race condition if they use the same transaction
                        cursor.continue();
//                        }
                } else {
                    newPhaseCb(c.PHASE_PLAYOFFS, phaseText);
                    Davis.location.assign(new Davis.Request("/l/" + g.lid + "/playoffs"));
                }
            };
        });
//                g.dbex('UPDATE team_attributes SET playoffs = TRUE WHERE season = :season AND tid IN :tids', season=g.season, tids=tids)
    }

    function newPhaseBeforeDraft() {
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
                        newPhaseCb(c.PHASE_BEFORE_DRAFT, phaseText);
                        Davis.location.assign(new Davis.Request("/l/" + g.lid + "/history"));
                    });
                };
            }
        };
    }

    function newPhaseDraft() {
        var phaseText;

        phaseText = g.season + " draft";
        newPhaseCb(c.PHASE_DRAFT, phaseText);
    }

    function newPhaseAfterDraft() {
        var phaseText;

        phaseText = g.season + " after draft";
        newPhaseCb(c.PHASE_AFTER_DRAFT, phaseText);
    }

    function newPhaseResignPlayers() {
        var phaseText, playerStore;

        phaseText = g.season + " resign players";

        playerStore = g.dbl.transaction("players", "readwrite").objectStore("players");

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
                            contractNegotiation.create(playerStore, p.pid, true);
                        });
                    }
                }
                cursor.continue();
            } else {
                newPhaseCb(c.PHASE_RESIGN_PLAYERS, phaseText);
                Davis.location.assign(new Davis.Request("/l/" + g.lid + "/negotiation"));
            }
        };
    }

    function newPhaseFreeAgency() {
        var phaseText, playerStore;

        phaseText = g.season + " free agency";

        // Delete all current negotiations to resign players
        contractNegotiation.cancelAll();

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
                newPhaseCb(c.PHASE_FREE_AGENCY, phaseText);
                Davis.location.assign(new Davis.Request("/l/" + g.lid + "/free_agents"));
            }
        };
    }

    /*Set a new phase of the game.

    This function is called to do all the crap that must be done during
    transitions between phases of the game, such as moving from the regular
    season to the playoffs. Phases are defined in the c.PHASE_* global
    variables.

    The phase update may happen asynchronously if the database must be accessed,
    so do not rely on g.phase being updated immediately after this function is
    called.
    */
    function newPhase(phase) {
        // Prevent code running twice
        if (phase === g.phase) {
            return;
        }

        if (phase === c.PHASE_PRESEASON) {
            newPhasePreseason();
        } else if (phase === c.PHASE_REGULAR_SEASON) {
            newPhaseRegularSeason();
        } else if (phase === c.PHASE_AFTER_TRADE_DEADLINE) {
            newPhaseAfterTradeDeadline();
        } else if (phase === c.PHASE_PLAYOFFS) {
            newPhasePlayoffs();
        } else if (phase === c.PHASE_BEFORE_DRAFT) {
            newPhaseBeforeDraft();
        } else if (phase === c.PHASE_DRAFT) {
            newPhaseDraft();
        } else if (phase === c.PHASE_AFTER_DRAFT) {
            newPhaseAfterDraft();
        } else if (phase === c.PHASE_RESIGN_PLAYERS) {
            newPhaseResignPlayers();
        } else if (phase === c.PHASE_FREE_AGENCY) {
            newPhaseFreeAgency();
        }
    }

    /*Creates a new regular season schedule with appropriate division and
    conference matchup distributions.
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

    /*Creates a single day's schedule for an in-progress playoffs.*/
    function newSchedulePlayoffsDay(cb) {
        var transaction;

        transaction = g.dbl.transaction(["playoffSeries", "teams"], "readwrite");

        // Make today's  playoff schedule
        transaction.objectStore("playoffSeries").openCursor(g.season).onsuccess = function (event) {
            var cursor, i, matchup, nextRound, numActiveTeams, playoffsOver, playoffSeries, rnd, series, tids, winners;

            cursor = event.target.result;
            playoffSeries = cursor.value;
            series = playoffSeries.series;
            rnd = playoffSeries.currentRound;
            tids = [];
            numActiveTeams = 0;
            playoffsOver = false;

            for (i = 0; i < series[rnd].length; i++) {
                if (series[rnd][i].home.won < 4 && series[rnd][i].away.won < 4) {
                    tids.push([series[rnd][i].home.tid, series[rnd][i].away.tid]);
                    numActiveTeams += 2;
                }
            }
            if (numActiveTeams > 0) {
                setSchedule(tids, function () { cb(numActiveTeams); });
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
/*                winners = {}
                r = g.dbex('SELECT sid, tid_home, tid_away, seed_home, seed_away, won_home, won_away FROM playoff_series WHERE round = :round AND season = :season ORDER BY sid ASC', round=current_round, season=g.season)
                for row in r.fetchall()) {
                    sid, tid_home, tid_away, seed_home, seed_away, won_home, won_away = row
                    if (won_home === 4) {
                        winners[sid] = [tid_home, seed_home]
                    } else {
                        winners[sid] = [tid_away, seed_away]
                    // Record user's team as conference and league champion
                    if (rnd === 2) {
                        g.dbex('UPDATE team_attributes SET conf_champs = TRUE WHERE season = :season AND tid = :tid', season=g.season, tid=winners[sid][0])
                    } else if (rnd === 3) {
                        g.dbex('UPDATE team_attributes SET league_champs = TRUE WHERE season = :season AND tid = :tid', season=g.season, tid=winners[sid][0])
                    }
                }*/

                // Are the whole playoffs over?
                if (rnd === 3) {
                    newPhase(c.PHASE_BEFORE_DRAFT);
                    playoffsOver = true;
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
                    cursor.update(playoffSeries, playoffsOver);
                }

                cb(numActiveTeams);
            }
        };
    }

    /*Computes the awards at the end of a season.*/
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
            players.sort(function (a, b) {  return (0.75 * b.pts + b.ast + b.trb) - (0.75 * a.pts + a.ast + a.trb); });
            p = players[0];
            awards.mvp = {pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, pts: p.pts, trb: p.trb, ast: p.ast};

            // Sixth Man of the Year - same sort as MVP
            for (i = 0; i < players.length; i++) {
                // Must have come off the bench in most games
                if (players[i].gs === 0 || players[i].gp / players[i].gs > 2) {
                    break;
                }
            }
            p = players[i];
            awards.smoy = {pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, pts: p.pts, trb: p.trb, ast: p.ast};

            // Rookie of the Year - same sort as MVP
            for (i = 0; i < players.length; i++) {
                // This doesn't factor in players who didn't start playing right after being drafted, because currently that doesn't really happen in the game.
                if (players[i].draftYear === g.season - 1) {
                    break;
                }
            }
            p = players[i];
            if (typeof p !== "undefined") { // I suppose there could be no rookies at all..
                awards.roy = {pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, pts: p.pts, trb: p.trb, ast: p.ast};
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
                _.last(awards.allLeague).players.push({pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, pts: p.pts, trb: p.trb, ast: p.ast});
            }

            // Defensive Player of the Year
            players.sort(function (a, b) {  return (b.trb + 5 * b.blk + 5 * b.stl) - (a.trb + 5 * a.blk + 5 * a.stl); });
            p = players[0];
            awards.dpoy = {pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, trb: p.trb, blk: p.blk, stl: p.stl};

            // All Defensive Team - same sort as DPOY
            awards.allDefensive = [{title: "First Team", players: []}];
            for (i = 0; i < 15; i++) {
                p = players[i];
                if (i === 5) {
                    awards.allDefensive.push({title: "Second Team", players: []});
                } else if (i === 10) {
                    awards.allDefensive.push({title: "Third Team", players: []});
                }
                _.last(awards.allDefensive).players.push({pid: p.pid, name: p.name, tid: p.tid, abbrev: p.abbrev, trb: p.trb, blk: p.blk, stl: p.stl});
            }

            attributes = ["tid", "abbrev", "region", "name", "cid"];
            stats = [];
            seasonAttributes = ["won", "lost", "winp"];
            db.getTeams(transaction, g.season, attributes, stats, seasonAttributes, "winp", function (teams) {
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

    /*Save the schedule to the database, overwriting what's currently there.

    Args:
        tids: A list of lists, each containing the team IDs of the home and
            away teams, respectively, for every game in the season.
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

    /*Returns an array of numDays days worth of games (really, just one day), or all games in the schedule if numDays
    is 0 (default). It is important that, when requesting a day's games, no team will be scheduled to play more than once that day.
    */
    function getSchedule(numDays, cb) {
        numDays = parseInt(numDays, 10);
        g.dbl.transaction(["schedule"]).objectStore("schedule").getAll().onsuccess = function (event) {
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
        awards: awards,
        setSchedule: setSchedule,
        getSchedule: getSchedule
    };
});