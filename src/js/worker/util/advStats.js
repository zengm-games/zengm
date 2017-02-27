// @flow

import Promise from 'bluebird';
import _ from 'underscore';
import {PHASE} from '../../common';
import g from '../../globals';
import {getCopy} from '../db';

/**
 * Calcualte the current season's Player Efficiency Rating (PER) for each active player and write it to the database.
 *
 * This is based on http://www.basketball-reference.com/about/per.html
 *
 * In the playoffs, only playoff stats are used.
 *
 * @memberOf util.advStats
 * @return {Promise}
 */
async function calculatePER() {
    // Total team stats (not per game averages) - gp, pts, ast, fg, plus all the others needed for league totals
    const teams = await getCopy.teams({
        attrs: ["tid"],
        stats: ["gp", "ft", "pf", "ast", "fg", "pts", "fga", "orb", "tov", "fta", "trb", "oppPts"],
        season: g.season,
        playoffs: PHASE.PLAYOFFS === g.phase,
        regularSeason: PHASE.PLAYOFFS !== g.phase,
        statType: 'totals',
    });

    // Total league stats (not per game averages) - gp, ft, pf, ast, fg, pts, fga, orb, tov, fta, trb
    const leagueStats = ["gp", "ft", "pf", "ast", "fg", "pts", "fga", "orb", "tov", "fta", "trb"];
    const league = teams.reduce((memo, t) => {
        for (let i = 0; i < leagueStats.length; i++) {
            if (memo.hasOwnProperty(leagueStats[i])) {
                memo[leagueStats[i]] += t.stats[leagueStats[i]];
            } else {
                memo[leagueStats[i]] = t.stats[leagueStats[i]];
            }
        }
        return memo;
    }, {});

    // If no games have been played, somehow, don't continue. But why would no games be played? I don't know, but it happens some times.
    if (league.gp === 0) {
        return;
    }

    // Calculate pace for each team, using the "estimated pace adjustment" formula rather than the "pace adjustment" formula because it's simpler and ends up at nearly the same result. To do this the real way, I'd probably have to store the number of possessions from core.gameSim.
    for (let i = 0; i < teams.length; i++) {
        //estimated pace adjustment = 2 * lg_PPG / (team_PPG + opp_PPG)
        teams[i].pace = 2 * (league.pts / league.gp) / (teams[i].stats.pts / teams[i].stats.gp + teams[i].stats.oppPts / teams[i].stats.gp);

        // Handle divide by 0 error - check for NaN
        if (teams[i].pace !== teams[i].pace) {
            teams[i].pace = 1;
        }
    }

    // Total player stats (not per game averages) - min, tp, ast, fg, ft, tov, fga, fta, trb, orb, stl, blk, pf
    // Active players have tid >= 0
    let players = await g.cache.indexGetAll('playersByTid', [0, Infinity]);
    players = await getCopy.playersPlus(players, {
        attrs: ["pid", "tid"],
        stats: ["min", "tp", "ast", "fg", "ft", "tov", "fga", "fta", "trb", "orb", "stl", "blk", "pf"],
        ratings: ["pos"],
        season: g.season,
        playoffs: PHASE.PLAYOFFS === g.phase,
        regularSeason: PHASE.PLAYOFFS !== g.phase,
        statType: 'totals',
    });

    const aPER = [];
    const mins = [];
    league.aPER = 0;
    for (let i = 0; i < players.length; i++) {
        const tid = players[i].tid;

        // Is the player active?
        players[i].active = true; // Assume all players are active, since the IndexedDB query above only takes tid >= 0
        if (PHASE.PLAYOFFS === g.phase) {
            players[i].active = false;
            if (!_.isEmpty(players[i].statsPlayoffs)) {
                players[i].active = true;
                players[i].stats = players[i].statsPlayoffs;
            }
        }

        if (players[i].active) {  // No need to calculate for non-active players
            const factor = (2 / 3) - (0.5 * (league.ast / league.fg)) / (2 * (league.fg / league.ft));
            const vop = league.pts / (league.fga - league.orb + league.tov + 0.44 * league.fta);
            const drbp = (league.trb - league.orb) / league.trb;  // DRB%

            let uPER;
            if (players[i].stats.min > 0) {
                uPER = (1 / players[i].stats.min) *
                             (players[i].stats.tp
                             + (2 / 3) * players[i].stats.ast
                             + (2 - factor * (teams[tid].stats.ast / teams[tid].stats.fg)) * players[i].stats.fg
                             + (players[i].stats.ft * 0.5 * (1 + (1 - (teams[tid].stats.ast / teams[tid].stats.fg)) + (2 / 3) * (teams[tid].stats.ast / teams[tid].stats.fg)))
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
            league.aPER += aPER[i] * players[i].stats.min;

            mins[i] = players[i].stats.min; // Save for EWA calculation
        }
    }

    const minFactor = g.quarterLength / 12;
    league.aPER /= (league.gp * 5 * 48 * minFactor);

    const PER = aPER.map(num => num * (15 / league.aPER));

    // Estimated Wins Added http://insider.espn.go.com/nba/hollinger/statistics
    const EWA = [];

    // Position Replacement Levels
    const prls = {
        PG: 11,
        G: 10.75,
        SG: 10.5,
        GF: 10.5,
        SF: 10.5,
        F: 11,
        PF: 11.5,
        FC: 11.05,
        C: 10.6,
    };

    for (let i = 0; i < players.length; i++) {
        if (players[i].active) {
            let prl;
            if (prls.hasOwnProperty(players[i].ratings.pos)) {
                prl = prls[players[i].ratings.pos];
            } else {
                // This should never happen unless someone manually enters the wrong position, which can happen in custom roster files
                prl = 10.75;
            }

            const va = players[i].stats.min * (PER[i] - prl) / 67;

            EWA[i] = va / 30 * 0.8; // 0.8 is a fudge factor to approximate the difference between (BBGM) EWA and (real) win shares
        }
    }

    // Save to database
    await Promise.all(players.map(async (p, i) => {
        if (!p.active) {
            return;
        }

        const ps = await g.cache.indexGet('playerStatsByPid', p.pid);
        ps.per = PER[i];
        ps.ewa = EWA[i];
    }));
}


/**
 * Calcualte the advanced stats for each active player and write them to the database.
 *
 * Currently this is just PER.
 *
 * @memberOf util.advStats
 * @return {Promise}
 */
const advStats = async () => {
    await calculatePER();
};

export default advStats;
