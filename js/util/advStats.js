/**
 * @name util.advStats
 * @namespace Advanced stats (PER, WS, etc) that require some nontrivial calculations and thus are calculated and cached once each day.
 */
define(["globals", "core/player", "core/team", "lib/underscore"], function (g, player, team, _) {
    "use strict";

    /**
     * Calcualte the current season's Player Efficiency Rating (PER) for each active player and write it to the database.
     *
     * This is based on http://www.basketball-reference.com/about/per.html
     *
     * In the playoffs, only playoff stats are used.
     *
     * @memberOf util.advStats
     * @param {function()} cb Callback function.
     */
    function calculatePER(cb) {
        // Total team stats (not per game averages) - gp, pts, ast, fg, plus all the others needed for league totals
        team.filter({
            attrs: ["tid"],
            stats: ["gp", "ft", "pf", "ast", "fg", "pts", "fga", "orb", "tov", "fta", "trb", "oppPts"],
            season: g.season,
            totals: true,
            playoffs: g.PHASE.PLAYOFFS === g.phase
        }, function (teams) {
            var i, league, leagueStats;

            // Total league stats (not per game averages) - gp, ft, pf, ast, fg, pts, fga, orb, tov, fta, trb
            leagueStats = ["gp", "ft", "pf", "ast", "fg", "pts", "fga", "orb", "tov", "fta", "trb"];
            league = _.reduce(teams, function (memo, team) {
                var i;
                for (i = 0; i < leagueStats.length; i++) {
                    if (memo.hasOwnProperty(leagueStats[i])) {
                        memo[leagueStats[i]] = memo[leagueStats[i]] + team[leagueStats[i]];
                    } else {
                        memo[leagueStats[i]] = team[leagueStats[i]];
                    }
                }
                return memo;
            }, {});

            // Calculate pace for each team, using the "estimated pace adjustment" formula rather than the "pace adjustment" formula because it's simpler and ends up at nearly the same result. To do this the real way, I'd probably have to store the number of possessions from core.gameSim.
            for (i = 0; i < teams.length; i++) {
                //estimated pace adjustment = 2 * lg_PPG / (team_PPG + opp_PPG)
                teams[i].pace = 2 * (league.pts / league.gp) / (teams[i].pts / teams[i].gp + teams[i].oppPts / teams[i].gp);
            }

            // Total player stats (not per game averages) - min, tp, ast, fg, ft, tov, fga, fta, trb, orb, stl, blk, pf
            // Active players have tid >= 0
            g.dbl.transaction("players").objectStore("players").index("tid").getAll(IDBKeyRange.lowerBound(0)).onsuccess = function (event) {
                var aPER, drbp, EWA, factor, i, mins, PER, players, tid, uPER, vop, tx;

                players = player.filter(event.target.result, {
                    attrs: ["pid", "tid", "pos"],
                    stats: ["min", "tp", "ast", "fg", "ft", "tov", "fga", "fta", "trb", "orb", "stl", "blk", "pf"],
                    season: g.season,
                    totals: true,
                    playoffs: g.PHASE.PLAYOFFS === g.phase
                });

                aPER = [];
                mins = [];
                league.aPER = 0;
                for (i = 0; i < players.length; i++) {
                    tid = players[i].tid;

                    // Is the player active?
                    players[i].active = true;  // Assume all players are active, since the IndexedDB query above only takes tid >= 0
                    if (g.PHASE.PLAYOFFS === g.phase) {
                        players[i].active = false;
                        if (!_.isEmpty(players[i].statsPlayoffs)) {
                            players[i].active = true;
                            players[i].stats = players[i].statsPlayoffs;
                        }
                    }

                    if (players[i].active) {  // No need to calculate for non-active players
                        factor = (2 / 3) - (0.5 * (league.ast / league.fg)) / (2 * (league.fg / league.ft));
                        vop = league.pts / (league.fga - league.orb + league.tov + 0.44 * league.fta);
                        drbp = (league.trb - league.orb) / league.trb;  // DRB%

                        if (players[i].stats.min > 0) {
                            uPER = (1 / players[i].stats.min) *
                                   (players[i].stats.tp
                                   + (2 / 3) * players[i].stats.ast
                                   + (2 - factor * (teams[tid].ast / teams[tid].fg)) * players[i].stats.fg
                                   + (players[i].stats.ft * 0.5 * (1 + (1 - (teams[tid].ast / teams[tid].fg)) + (2 / 3) * (teams[tid].ast / teams[tid].fg)))
                                   - vop * players[i].stats.tov
                                   - vop * drbp * (players[i].stats.fga - players[i].stats.fg)
                                   - vop * 0.44 * (0.44 + (0.56 * drbp)) * (players[i].stats.fta - players[i].stats.ft)
                                   + vop * (1 - drbp) * (players[i].stats.trb - players[i].stats.orb)
                                   + vop * drbp * players[i].stats.orb
                                   + vop * players[i].stats.stl
                                   + vop * drbp * players[i].stats.blk
                                   - players[i].stats.pf * ((league.ft / league.pf) - 0.44 * (league.fta / league.pf) * vop));
                        } else {
                            uPER = 0;
                        }

                        aPER[i] = teams[tid].pace * uPER;
                        league.aPER = league.aPER + aPER[i] * players[i].stats.min;

                        mins[i] = players[i].stats.min; // Save for EWA calculation
                    }
                }

                league.aPER = league.aPER / (league.gp * 5 * 48);

                PER = _.map(aPER, function (num) { return num * (15 / league.aPER); });

                // Estimated Wins Added http://insider.espn.go.com/nba/hollinger/statistics
                EWA = [];
                (function () {
                    var i, prls, va;

                    // Position Replacement Levels
                    prls = {
                        PG: 11,
                        G: 10.75,
                        SG: 10.5,
                        GF: 10.5,
                        SF: 10.5,
                        F: 11,
                        PF: 11.5,
                        FC: 11.05,
                        C: 10.6
                    };

                    for (i = 0; i < players.length; i++) {
                        if (players[i].active) {
                            va = players[i].stats.min * (PER[i] - prls[players[i].pos]) / 67;

                            EWA[i] = va / 30 * 0.8; // 0.8 is a fudge factor to approximate the difference between (BBGM) EWA and (real) win shares
                        }
                    }
                }());

                // Save to database. Active players have tid >= 0
                tx = g.dbl.transaction("players", "readwrite");
                tx.objectStore("players").index("tid").openCursor(IDBKeyRange.lowerBound(0)).onsuccess = function (event) {
                    var cursor, i, p, s;

                    cursor = event.target.result;
                    if (cursor) {
                        p = cursor.value;

                        for (i = 0; i < players.length; i++) {
                            if (PER[i] !== undefined && !isNaN(PER[i]) && players[i].pid === p.pid) {
                                s = p.stats.length - 1;
                                // This will be either playoffs or regular season, as appropriate
                                p.stats[s].per = PER[i];
                                p.stats[s].ewa = EWA[i];

                                cursor.update(p);

                                break;
                            }
                        }

                        cursor.continue();
                    }
                };
                tx.oncomplete = function () {
                    if (cb !== undefined) {
                        cb();
                    }
                };
            };
        });
    }


    /**
     * Calcualte the advanced stats for each active player and write them to the database.
     *
     * Currently this is just PER.
     *
     * @memberOf util.advStats
     * @param {function()} cb Callback function.
     */
    function calculateAll(cb) {
        calculatePER(cb);
    }

    return {
        calculateAll: calculateAll
    };
});