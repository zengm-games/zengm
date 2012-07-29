define(["db", "core/player", "util/helpers", "util/playMenu", "util/random"], function (db, player, helpers, playMenu, random) {
    "use strict";

    /*Set a new phase of the game.

    This function is called to do all the crap that must be done during
    transitions between phases of the game, such as moving from the regular
    season to the playoffs. Phases are defined in the c.PHASE_* global
    variables.

    The phase update may happen asynchronously if the database must be accessed,
    so do not rely on g.phase being updated immediately after this function is
    called.

    Returns:
        false if everything went well, or a string containing an error message
        to be sent to the client.
    */
    function newPhase(phase) {
        var attributes, phaseText, playerStore, releasedPlayersStore, seasonAttributes, tid, transaction;

        // Prevent code running twice
        if (phase === g.phase) {
            return;
        }

        // This should be called after the phase-specific stuff runs. It needs to be a separate function like this to play nice with async stuff.
        function cb(phase, phaseText) {
            helpers.setGameAttributes({phase: phase});
            playMenu.setPhase(phaseText);
            playMenu.refreshOptions();
        }

        if (phase === c.PHASE_PRESEASON) {
            helpers.setGameAttributes({season: g.season + 1});
            phaseText = g.season + " preseason";

            transaction = g.dbl.transaction(["players", "teams"], IDBTransaction.READ_WRITE);

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
/*                            // AI teams sign free agents
                            free_agents_auto_sign()*/
                            cb(phase, phaseText);
                        }
                    };
                }
            };
        } else if (phase === c.PHASE_REGULAR_SEASON) {
            phaseText = g.season + " regular season";
/*            // First, make sure teams are all within the roster limits
            // CPU teams
            r = g.dbex('SELECT pa.tid, COUNT(*) FROM team_attributes as ta, player_attributes as pa WHERE ta.tid = pa.tid AND ta.season = :season GROUP BY pa.tid', season=g.season)
            teams = r.fetchall()
            for tid, num_players_on_roster in teams) {
                if (num_players_on_roster > 15) {
                    if (tid === g.user_tid) {
                        alert("Your team currently has more than the maximum number of players (15). You must release or buy out players (from the Roster page) before the season starts.");
                    else {
                        // Automatically drop lowest pot players until we reach 15
                        r = g.dbex('SELECT pa.pid FROM player_attributes as pa, player_ratings as pr WHERE pa.pid = pr.pid AND pa.tid = :tid AND pr.season = :season ORDER BY pr.pot ASC LIMIT :n_excess_players', tid=tid, season=g.season, n_excess_players=num_players_on_roster-15)
                        for pid, in r.fetchall()) {
                            // Release player.
                            p = player.Player()
                            p.load(pid)
                            p.release()
                else if (num_players_on_roster < 5) {
                    if (tid === g.user_tid) {
                        alert("Your team currently has less than the minimum number of players (5). You must add players (through free agency or trades) before the season starts.");
                    else {
                        // Should auto-add players
                        pass*/

            newSchedule(function () { cb(phase, phaseText); });

            // Auto sort rosters (except player's team)
            playerStore = g.dbl.transaction("players", IDBTransaction.READ_WRITE).objectStore("players");
            for (tid = 0; tid < g.numTeams; tid++) {
                if (tid !== g.userTid) {
                    db.rosterAutoSort(playerStore, tid);
                }
            }
        } else if (phase === c.PHASE_AFTER_TRADE_DEADLINE) {
            phaseText = g.season + " regular season, after trade deadline";
            cb(phase, phaseText);
        } else if (phase === c.PHASE_PLAYOFFS) {
            phaseText = g.season + " playoffs";

            // Select winners of the season's awards
//            awards()

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
                g.dbl.transaction(["playoffSeries"], IDBTransaction.READ_WRITE).objectStore("playoffSeries").add(row);

                // Add row to team stats and team season attributes
                g.dbl.transaction(["teams"], IDBTransaction.READ_WRITE).objectStore("teams").openCursor().onsuccess = function (event) {
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
                            g.dbl.transaction(["players"], IDBTransaction.READ_WRITE).objectStore("players").index("tid").openCursor(IDBKeyRange.only(team.tid)).onsuccess = function (event) {
                                var cursorP, key, p, playerPlayoffStats;

                                cursorP = event.target.result;
                                if (cursorP) {
                                    p = cursorP.value;
                                    p = player.addStatsRow(p, p.tid, true);
                                    cursorP.update(p);
                                    cursorP.continue();
                                }
/*                                else {
                                    cursor.continue();
                                }*/
                            };
                        }
//                        else {
// RACE CONDITION: Should only run after the players update above finishes. won't be a race condition if they use the same transaction
                            cursor.continue();
//                        }
                    } else {
                        cb(phase, phaseText);
                    }
                };
            });
//                g.dbex('UPDATE team_attributes SET playoffs = TRUE WHERE season = :season AND tid IN :tids', season=g.season, tids=tids)
        } else if (phase === c.PHASE_BEFORE_DRAFT) {
            phaseText = g.season + " before draft";

            // Remove released players' salaries from payrolls
            releasedPlayersStore = g.dbl.transaction("releasedPlayers", IDBTransaction.READ_WRITE).objectStore("releasedPlayers");
            releasedPlayersStore.index("contractExp").getAll(g.season).onsuccess = function (event) {
                var i, releasedPlayers;

                releasedPlayers = event.target.result;

                for (i = 0; i < releasedPlayers.length; i++) {
                    releasedPlayersStore.delete(releasedPlayers[i].rid);
                }
            };

            // Add a year to the free agents
//            g.dbex('UPDATE player_attributes SET contract_exp = contract_exp + 1 WHERE tid = :tid', tid=c.PLAYER_FREE_AGENT)

            cb(phase, phaseText);
        } else if (phase === c.PHASE_DRAFT) {
            phaseText = g.season + " draft";
            cb(phase, phaseText);
        } else if (phase === c.PHASE_AFTER_DRAFT) {
            phaseText = g.season + " after draft";
            cb(phase, phaseText);
        } else if (phase === c.PHASE_RESIGN_PLAYERS) {
            phaseText = g.season + " resign players";

            // Check for retiring players
            // Call the contructor each season because that's where the code to check for retirement is
//            rpw = retired_players_window.RetiredPlayersWindow(self)  // Do the retired player check
//            rpw.retired_players_window.run()
//            rpw.retired_players_window.destroy()

/*            // Resign players
            r = g.dbex('SELECT pid, tid, name FROM player_attributes WHERE contract_exp = :season AND tid >= 0', season=g.season)
            for pid, tid, name in r.fetchall()) {
                if (tid !== g.user_tid) {
                    // Automatically negotiate with teams
                    resign = random.choice([true, false])
                    p = player.Player()
                    p.load(pid)
                    if (resign) {
                        amount, expiration = p.contract()
                        g.dbex('UPDATE player_attributes SET contract_amount = :contract_amount, contract_exp = :contract_exp WHERE pid = :pid', contract_amount=amount, contract_exp=expiration, pid=pid)
                    else {
                        p.add_to_free_agents(phase)
                else {
                    // Add to free agents first, to generate a contract demand
                    p = player.Player()
                    p.load(pid)
                    p.add_to_free_agents(phase)

                    // Open negotiations with player
                    error = contract_negotiation.new(pid, resigning=true)
                    if (error) {
                        app.logger.debug(error)*/
            cb(phase, phaseText);
        } else if (phase === c.PHASE_FREE_AGENCY) {
            phaseText = g.season + " free agency";

/*            // Delete all current negotiations to resign players
            contractNegotiation.cancelAll()

            // Reset contract demands of current free agents
            r = g.dbex('SELECT pid FROM player_attributes WHERE tid = :tid', tid=c.PLAYER_FREE_AGENT)
            for pid, in r.fetchall()) {
                p = player.Player()
                p.load(pid)
                p.add_to_free_agents(phase)

            // Move undrafted players to free agent pool
            r = g.dbex('SELECT pid FROM player_attributes WHERE tid = :tid', tid=c.PLAYER_UNDRAFTED)
            for pid, in r.fetchall()) {
                g.dbex('UPDATE player_attributes SET draft_year = -1, round = -1, draft_pick = -1, draft_tid = -1 WHERE pid = :pid', pid=pid)
                p = player.Player()
                p.load(pid)
                p.add_to_free_agents(phase)*/
            cb(phase, phaseText);
        }
    }

    /*Creates a new regular season schedule with appropriate division and
    conference matchup distributions.
    */
    function newSchedule(cb) {
        helpers.getTeams(undefined, function (teamsAll) {
            var cid, dids, game, games, good, i, ii, iters, j, jj, k, matchup, matchups, n, newMatchup, t, team, teams, tids, tidsByConf, tryNum;

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

            random.shuffle(tids);
            setSchedule(tids, cb);
        });
    }

    /*Creates a single day's schedule for an in-progress playoffs.*/
    function newSchedulePlayoffsDay(cb) {
        // Make today's  playoff schedule
        g.dbl.transaction(["playoffSeries"], IDBTransaction.READ_WRITE).objectStore("playoffSeries").openCursor(IDBKeyRange.only(g.season)).onsuccess = function (event) {
            var cursor, i, matchup, nextRound, numActiveTeams, playoffsOver, playoffSeries, rnd, series, tids;

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
/*
                // Who won?
                winners = {}
                r = g.dbex('SELECT sid, tid_home, tid_away, seed_home, seed_away, won_home, won_away FROM playoff_series WHERE round = :round AND season = :season ORDER BY sid ASC', round=current_round, season=g.season)
                for row in r.fetchall()) {
                    sid, tid_home, tid_away, seed_home, seed_away, won_home, won_away = row
                    if (won_home === 4) {
                        winners[sid] = [tid_home, seed_home]
                    else {
                        winners[sid] = [tid_away, seed_away]
                    // Record user's team as conference and league champion
                    if (current_round === 3) {
                        g.dbex('UPDATE team_attributes SET conf_champs = TRUE WHERE season = :season AND tid = :tid', season=g.season, tid=winners[sid][0])
                    else if (current_round === 4) {
                        g.dbex('UPDATE team_attributes SET league_champs = TRUE WHERE season = :season AND tid = :tid', season=g.season, tid=winners[sid][0])*/

                cb(numActiveTeams);
            }
        };
    }

    /*Computes the awards at the end of a season.*/
    function awards() {
/*        // Cache averages
        g.dbex('CREATE TEMPORARY TABLE awards_avg (pid INTEGER PRIMARY KEY, name VARCHAR(255), tid INTEGER, abbrev VARCHAR(3), draft_year INTEGER, games_played INTEGER, games_started INTEGER, min FLOAT, pts FLOAT, trb FLOAT, ast FLOAT, blk FLOAT, stl FLOAT)')
        g.dbex('INSERT INTO awards_avg (pid, name, tid, abbrev, draft_year, games_played, games_started, min, pts, trb, ast, blk, stl) (SELECT pa.pid, pa.name, pa.tid, ta.abbrev, pa.draft_year, SUM(CASE WHEN ps.min > 0 THEN 1 ELSE 0 END) AS games_played, SUM(ps.gs) AS games_started, AVG(ps.min) AS min, AVG(ps.pts) AS pts, AVG(ps.orb+ps.drb) AS trb, AVG(ps.ast) AS ast, AVG(ps.blk) AS blk, AVG(ps.stl) AS stl FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.pid = ps.pid AND ps.season = :season AND ps.playoffs = FALSE AND ta.tid = pa.tid AND ta.season = ps.season GROUP BY ps.pid)', season=g.season)

        r = g.dbex('SELECT tid, abbrev, region, name, won, lost FROM team_attributes AS ta WHERE season = :season AND (SELECT cid FROM divisions AS ld WHERE ld.did = ta.did) = 0 ORDER BY CASE won + lost WHEN 0 THEN 0 ELSE won / (won + lost) END DESC', season=g.season)
        bre = r.fetchone()
        r = g.dbex('SELECT tid, abbrev, region, name, won, lost FROM team_attributes AS ta WHERE season = :season AND (SELECT cid FROM divisions AS ld WHERE ld.did = ta.did) = 1 ORDER BY CASE won + lost WHEN 0 THEN 0 ELSE won / (won + lost) END DESC', season=g.season)
        brw = r.fetchone()

        r = g.dbex('SELECT pid, name, tid, abbrev, pts, trb, ast FROM awards_avg ORDER BY (0.75 * pts) + ast + trb DESC')
        mvp =  r.fetchone()
        r = g.dbex('SELECT pid, name, tid, abbrev, trb, blk, stl FROM awards_avg ORDER BY trb + 5 * blk + 5 * stl DESC')
        dpoy = r.fetchone()
        r = g.dbex('SELECT pid, name, tid, abbrev, pts, trb, ast FROM awards_avg WHERE games_played/(games_started+1) > 2 ORDER BY (0.75 * pts) + ast + trb DESC')
        smoy = r.fetchone()
        r = g.dbex('SELECT pid, name, tid, abbrev, pts, trb, ast FROM awards_avg WHERE draft_year = :season - 1 ORDER BY (0.75 * pts) + ast + trb DESC', season=g.season)
        roy = r.fetchone()

        g.dbex('INSERT INTO awards (season, bre_tid, bre_abbrev, bre_region, bre_name, bre_won, bre_lost, brw_tid, brw_abbrev, brw_region, brw_name, brw_won, brw_lost, mvp_pid, mvp_name, mvp_tid, mvp_abbrev, mvp_pts, mvp_trb, mvp_ast, dpoy_pid, dpoy_name, dpoy_tid, dpoy_abbrev, dpoy_trb, dpoy_blk, dpoy_stl, smoy_pid, smoy_name, smoy_tid, smoy_abbrev, smoy_pts, smoy_trb, smoy_ast, roy_pid, roy_name, roy_tid, roy_abbrev, roy_pts, roy_trb, roy_ast) VALUES (:season, :bre_tid, :bre_abbrev, :bre_region, :bre_name, :bre_won, :bre_lost, :brw_tid, :brw_abbrev, :brw_region, :brw_name, :brw_won, :brw_lost, :mvp_pid, :mvp_name, :mvp_tid, :mvp_abbrev, :mvp_pts, :mvp_trb, :mvp_ast, :dpoy_pid, :dpoy_name, :dpoy_tid, :dpoy_abbrev, :dpoy_trb, :dpoy_blk, :dpoy_stl, :smoy_pid, :smoy_name, :smoy_tid, :smoy_abbrev, :smoy_pts, :smoy_trb, :smoy_ast, :roy_pid, :roy_name, :roy_tid, :roy_abbrev, :roy_pts, :roy_trb, :roy_ast)', season=g.season, bre_tid=bre['tid'], bre_abbrev=bre['abbrev'], bre_region=bre['region'], bre_name=bre['name'], bre_won=bre['won'], bre_lost=bre['lost'], brw_tid=brw['tid'], brw_abbrev=brw['abbrev'], brw_region=brw['region'], brw_name=brw['name'], brw_won=brw['won'], brw_lost=brw['lost'], mvp_pid=mvp['pid'], mvp_name=mvp['name'], mvp_tid=mvp['tid'], mvp_abbrev=mvp['abbrev'], mvp_pts=mvp['pts'], mvp_trb=mvp['trb'], mvp_ast=mvp['ast'], dpoy_pid=dpoy['pid'], dpoy_name=dpoy['name'], dpoy_tid=dpoy['tid'], dpoy_abbrev=dpoy['abbrev'], dpoy_trb=dpoy['trb'], dpoy_blk=dpoy['blk'], dpoy_stl=dpoy['stl'], smoy_pid=smoy['pid'], smoy_name=smoy['name'], smoy_tid=smoy['tid'], smoy_abbrev=smoy['abbrev'], smoy_pts=smoy['pts'], smoy_trb=smoy['trb'], smoy_ast=smoy['ast'], roy_pid=roy['pid'], roy_name=roy['name'], roy_tid=roy['tid'], roy_abbrev=roy['abbrev'], roy_pts=roy['pts'], roy_trb=roy['trb'], roy_ast=roy['ast'])

        g.dbex('INSERT INTO awards_all_league (season, team_type, pid, name, abbrev, pts, trb, ast, blk, stl) (SELECT :season, \'league\', pid, name, abbrev, pts, trb, ast, blk, stl FROM awards_avg ORDER BY (0.75 * pts) + ast + trb DESC LIMIT 15)', season=g.season)
        g.dbex('INSERT INTO awards_all_league (season, team_type, pid, name, abbrev, pts, trb, ast, blk, stl) (SELECT :season, \'defensive\', pid, name, abbrev, pts, trb, ast, blk, stl FROM awards_avg ORDER BY trb + 5 * blk + 5 * stl DESC LIMIT 15)', season=g.season)

        g.dbex('DROP TABLE awards_avg')*/
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
            scheduleStore = g.dbl.transaction(["schedule"], IDBTransaction.READ_WRITE).objectStore("schedule");
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