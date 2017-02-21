// @flow

import backboard from 'backboard';
import Promise from 'bluebird';
import orderBy from 'lodash.orderby';
import _ from 'underscore';
import g from '../globals';
import * as draft from './draft';
import * as player from './player';
import * as trade from './trade';
import {getCopy} from '../db';
import logEvent from '../util/logEvent';
import * as helpers from '../util/helpers';
import * as random from '../util/random';
import type {ContractInfo, TeamFiltered, TeamSeason, TeamStats, TradePickValues} from '../util/types';

function genSeasonRow(tid: number, prevSeason?: TeamSeason): TeamSeason {
    const newSeason = {
        tid,
        season: g.season,
        gp: 0,
        gpHome: 0,
        att: 0,
        cash: 10000,
        won: 0,
        lost: 0,
        wonHome: 0,
        lostHome: 0,
        wonAway: 0,
        lostAway: 0,
        wonDiv: 0,
        lostDiv: 0,
        wonConf: 0,
        lostConf: 0,
        lastTen: [],
        streak: 0,
        playoffRoundsWon: -1,  // -1: didn't make playoffs. 0: lost in first round. ... N: won championship
        hype: Math.random(),
        pop: 0,  // Needs to be set somewhere!
        revenues: {
            merch: {
                amount: 0,
                rank: 15.5,
            },
            sponsor: {
                amount: 0,
                rank: 15.5,
            },
            ticket: {
                amount: 0,
                rank: 15.5,
            },
            nationalTv: {
                amount: 0,
                rank: 15.5,
            },
            localTv: {
                amount: 0,
                rank: 15.5,
            },
        },
        expenses: {
            salary: {
                amount: 0,
                rank: 15.5,
            },
            luxuryTax: {
                amount: 0,
                rank: 15.5,
            },
            minTax: {
                amount: 0,
                rank: 15.5,
            },
            scouting: {
                amount: 0,
                rank: 15.5,
            },
            coaching: {
                amount: 0,
                rank: 15.5,
            },
            health: {
                amount: 0,
                rank: 15.5,
            },
            facilities: {
                amount: 0,
                rank: 15.5,
            },
        },
        payrollEndOfSeason: -1,
    };

    if (prevSeason) {
        // New season, carrying over some values from the previous season
        newSeason.pop = prevSeason.pop * random.uniform(0.98, 1.02);  // Mean population should stay constant, otherwise the economics change too much
        newSeason.hype = prevSeason.hype;
        newSeason.cash = prevSeason.cash;
    }

    return newSeason;
}

/**
 * Generate a new row of team stats.
 *
 * A row contains stats for unique values of (season, playoffs). So new rows need to be added when a new season starts or when a team makes the playoffs.
 *
 * @memberOf core.team
 * @param {=boolean} playoffs Is this stats row for the playoffs or not? Default false.
 * @return {Object} Team stats object.
 */
function genStatsRow(tid: number, playoffs?: boolean = false): TeamStats {
    return {
        tid,
        season: g.season,
        playoffs,
        gp: 0,
        min: 0,
        fg: 0,
        fga: 0,
        fgAtRim: 0,
        fgaAtRim: 0,
        fgLowPost: 0,
        fgaLowPost: 0,
        fgMidRange: 0,
        fgaMidRange: 0,
        tp: 0,
        tpa: 0,
        ft: 0,
        fta: 0,
        orb: 0,
        drb: 0,
        trb: 0,
        ast: 0,
        tov: 0,
        stl: 0,
        blk: 0,
        ba: 0,
        pf: 0,
        pts: 0,
        oppPts: 0,
    };
}

/**
 * Create a new team object.
 *
 * @memberOf core.team
 * @param {Object} tm Team metadata object, likely from core.league.create.
 * @return {Object} Team object to insert in the database.
 */
function generate(tm: any) {
    let strategy;
    if (tm.hasOwnProperty("strategy")) {
        strategy = tm.strategy;
    } else {
        strategy = Math.random() > 0.5 ? "contending" : "rebuilding";
    }

    return {
        tid: tm.tid,
        cid: tm.cid,
        did: tm.did,
        region: tm.region,
        name: tm.name,
        abbrev: tm.abbrev,
        imgURL: tm.imgURL !== undefined ? tm.imgURL : "",
        budget: {
            ticketPrice: {
                amount: tm.hasOwnProperty("budget") ? tm.budget.ticketPrice.amount : Number(helpers.round((g.salaryCap / 90000) * 37 + 25 * (g.numTeams - tm.popRank) / (g.numTeams - 1)), 2),
                rank: tm.hasOwnProperty("budget") ? tm.budget.ticketPrice.rank : tm.popRank,
            },
            scouting: {
                amount: tm.hasOwnProperty("budget") ? tm.budget.scouting.amount : Number(helpers.round((g.salaryCap / 90000) * 1350 + 900 * (g.numTeams - tm.popRank) / (g.numTeams - 1))) * 10,
                rank: tm.hasOwnProperty("budget") ? tm.budget.scouting.rank : tm.popRank,
            },
            coaching: {
                amount: tm.hasOwnProperty("budget") ? tm.budget.coaching.amount : Number(helpers.round((g.salaryCap / 90000) * 1350 + 900 * (g.numTeams - tm.popRank) / (g.numTeams - 1))) * 10,
                rank: tm.hasOwnProperty("budget") ? tm.budget.coaching.rank : tm.popRank,
            },
            health: {
                amount: tm.hasOwnProperty("budget") ? tm.budget.health.amount : Number(helpers.round((g.salaryCap / 90000) * 1350 + 900 * (g.numTeams - tm.popRank) / (g.numTeams - 1))) * 10,
                rank: tm.hasOwnProperty("budget") ? tm.budget.health.rank : tm.popRank,
            },
            facilities: {
                amount: tm.hasOwnProperty("budget") ? tm.budget.facilities.amount : Number(helpers.round((g.salaryCap / 90000) * 1350 + 900 * (g.numTeams - tm.popRank) / (g.numTeams - 1))) * 10,
                rank: tm.hasOwnProperty("budget") ? tm.budget.facilities.rank : tm.popRank,
            },
        },
        strategy,
    };
}

/**
 * Given a list of players sorted by ability, find the starters.
 *
 *
 * @param  {[type]} players [description]
 * @param {Array.<string>} p Array positions of players on roster, sorted by value already.
 * @return {Array.<number>} Indexes of the starters from the input array. If this is of length < 5, then satisfactory starters couldn't be found and any players should be used to fill in the starting lineup.
 */
function findStarters(positions: string[]): number[] {
    const starters = []; // Will be less than 5 in length if that's all it takes to meet requirements
    let numG = 0;
    let numFC = 0;
    let numC = 0;
    for (let i = 0; i < positions.length; i++) {
        if (starters.length === 5 || (numG >= 2 && numFC >= 2)) { break; }

        // Make sure we can get 2 G and 2 F/C
        if ((5 - starters.length > ((2 - numG) > 0 ? (2 - numG) : 0) + ((2 - numFC) > 0 ? (2 - numFC) : 0)) ||
                (numG < 2 && positions[i].includes('G')) ||
                (numFC < 2 && (positions[i].includes('F') || (positions[i] === 'C' && numC === 0)))) {
            starters.push(i);
            numG += positions[i].includes('G') ? 1 : 0;
            numFC += (positions[i].includes('F') || positions[i] === 'C') ? 1 : 0;
            numC += positions[i] === 'C' ? 1 : 0;
        }
    }

    // Fill in after meeting requirements, but still not too many Cs!
    for (let i = 0; i < positions.length; i++) {
        if (starters.length === 5) { break; }
        if (starters.includes(i)) { continue; }
        if (numC >= 1 && positions[i] === 'c') { continue; }

        starters.push(i);
        numC += positions[i] === 'C' ? 1 : 0;
    }

    return starters;
}

/**
 * Sort a team's roster based on player ratings and stats.
 *
 * @memberOf core.team
 * @param {number} tid Team ID.
 * @return {Promise}
 */
async function rosterAutoSort(tid: number) {
    // Get roster and sort by value (no potential included)
    const playersFromCache = await g.cache.indexGetAll('playersByTid', tid);
    let players = helpers.deepCopy(playersFromCache);
    players = await getCopy.players(players, {
        attrs: ["pid", "valueNoPot", "valueNoPotFuzz"],
        ratings: ["pos"],
        season: g.season,
        showNoStats: true,
        showRookies: true,
    });
    // Fuzz only for user's team
    if (tid === g.userTid) {
        players.sort((a, b) => b.valueNoPotFuzz - a.valueNoPotFuzz);
    } else {
        players.sort((a, b) => b.valueNoPot - a.valueNoPot);
    }

    // Shuffle array so that position conditions are met - 2 G and 2 F/C in starting lineup, at most one pure C
    const positions = players.map(p => p.ratings.pos);
    const starters = findStarters(positions);
    const newPlayers = starters.map(i => players[i]);
    for (let i = 0; i < players.length; i++) {
        if (!starters.includes(i)) {
            newPlayers.push(players[i]);
        }
    }
    players = newPlayers;

    for (let i = 0; i < players.length; i++) {
        players[i].rosterOrder = i;
    }

    // Update rosterOrder
    for (const p of playersFromCache) {
        for (let i = 0; i < players.length; i++) {
            if (players[i].pid === p.pid) {
                if (p.rosterOrder !== players[i].rosterOrder) {
                    // Only write to DB if this actually changes
                    p.rosterOrder = players[i].rosterOrder;
                }
                break;
            }
        }
    }
}

/**
* Gets all the contracts a team owes.
*
* This includes contracts for players who have been released but are still owed money.
*
* @memberOf core.team
* @param {number} tid Team ID.
* @returns {Promise.Array} Array of objects containing contract information.
*/
async function getContracts(tid: number): Promise<ContractInfo[]> {
    // First, get players currently on the roster
    const players = await g.cache.indexGetAll('playersByTid', tid);

    const contracts = players.map(p => {
        return {
            pid: p.pid,
            firstName: p.firstName,
            lastName: p.lastName,
            skills: p.ratings[p.ratings.length - 1].skills,
            injury: p.injury,
            watch: p.watch !== undefined ? p.watch : false, // undefined check is for old leagues, can delete eventually
            amount: p.contract.amount,
            exp: p.contract.exp,
            released: false,
        };
    });

    // Then, get any released players still owed money
    const releasedPlayers = await g.cache.indexGetAll('releasedPlayersByTid', tid);

    for (const releasedPlayer of releasedPlayers) {
        const p = await g.cache.get('players', releasedPlayer.pid);
        if (p !== undefined) { // If a player is deleted, such as if the user deletes retired players to improve performance, this will be undefined
            contracts.push({
                pid: releasedPlayer.pid,
                firstName: p.firstName,
                lastName: p.lastName,
                skills: p.ratings[p.ratings.length - 1].skills,
                injury: p.injury,
                amount: releasedPlayer.contract.amount,
                exp: releasedPlayer.contract.exp,
                released: true,
            });
        } else {
            contracts.push({
                pid: releasedPlayer.pid,
                firstName: "Deleted",
                lastName: "Player",
                skills: [],
                amount: releasedPlayer.contract.amount,
                exp: releasedPlayer.contract.exp,
                released: true,
            });
        }
    }

    return contracts;
}

/**
 * Get the total current payroll for a team.
 *
 * This includes players who have been released but are still owed money from their old contracts.
 *
 * @memberOf core.team
 * @param {IDBTransaction|null} tx An IndexedDB transaction on players and releasedPlayers; if null is passed, then a new transaction will be used.
 * @return {Promise.<number, Array=>} Resolves to an array; first argument is the payroll in thousands of dollars, second argument is the array of contract objects from getContracts.
 */
async function getPayroll(tid: number): Promise<[number, ContractInfo[]]> {
    const contracts = await getContracts(tid);

    let payroll = 0;
    for (let i = 0; i < contracts.length; i++) {
        payroll += contracts[i].amount;  // No need to check exp, since anyone without a contract for the current season will not have an entry
    }

    return [payroll, contracts];
}

/**
 * Get the total current payroll for every team team.
 *
 * @memberOf core.team
 * @return {Promise} Resolves to an array of payrolls, ordered by team id.
 */
function getPayrolls(): Promise<number[]> {
    const promises = [];
    for (let tid = 0; tid < g.numTeams; tid++) {
        promises.push(getPayroll(tid).get(0));
    }

    return Promise.all(promises);
}

/**
 * Retrieve a filtered team object (or an array of player objects) from the database by removing/combining/processing some components.
 *
 * This can be used to retrieve information about a certain season, compute average statistics from the raw data, etc.
 *
 * This is similar to player.filter, but has some differences. If only one season is requested, the attrs, seasonAttrs, and stats properties will all be merged on the root filtered team object for each team. "stats" is broken out into its own property only when multiple seasons are requested (options.season is undefined). "seasonAttrs" behaves similarly, when multiple seasons are requested they appear in an array property "seasons".
 *
 * @memberOf core.team
 * @param {Object} options Options, as described below.
 * @param {number=} options.season Season to retrieve stats/ratings for. If undefined, return stats for all seasons in a list called "stats".
 * @param {number=} options.tid Team ID. Set this if you want to return only one team object. If undefined, an array of all teams is returned, ordered by tid by default.
 * @param {Array.<string>=} options.attrs List of team attributes to include in output (e.g. region, abbrev, name, ...).
 * @param {Array.<string>=} options.seasonAttrs List of seasonal team attributes to include in output (e.g. won, lost, payroll, ...).
 * @param {Array.<string=>} options.stats List of team stats to include in output (e.g. fg, orb, ast, blk, ...).
 * @param {boolean=} options.totals Boolean representing whether to return total stats (true) or per-game averages (false); default is false.
 * @param {boolean=} options.playoffs Boolean representing whether to return playoff stats or not; default is false. Unlike player.filter, team.filter returns either playoff stats or regular season stats, never both.
 * @param {string=} options.sortBy Sorting method. "winp" sorts by descending winning percentage. If undefined, then teams are returned in order of their team IDs (which is alphabetical, currently).
 * @param {IDBTransaction|null=} options.ot An IndexedDB transaction on players, releasedPlayers, and teams; if null/undefined, then a new transaction will be used.
 * @return {Promise.(Object|Array.<Object>)} Filtered team object or array of filtered team objects, depending on the inputs.
 */
function filter(options: any): Promise<TeamFiltered | TeamFiltered[]> {
    options = options !== undefined ? options : {};
    options.season = options.season !== undefined ? options.season : null;
    options.tid = options.tid !== undefined ? options.tid : null;
    options.attrs = options.attrs !== undefined ? options.attrs : [];
    options.seasonAttrs = options.seasonAttrs !== undefined ? options.seasonAttrs : [];
    options.stats = options.stats !== undefined ? options.stats : [];
    options.totals = options.totals !== undefined ? options.totals : false;
    options.playoffs = options.playoffs !== undefined ? options.playoffs : false;
    options.sortBy = options.sortBy !== undefined ? options.sortBy : "";

    // Copys/filters the attributes listed in options.attrs from p to fp.
    const filterAttrs = (ft, t, {attrs}) => {
        for (let j = 0; j < attrs.length; j++) {
            if (attrs[j] === "budget") {
                ft.budget = helpers.deepCopy(t.budget);
                _.each(ft.budget, (value, key) => {
                    if (key !== "ticketPrice") {  // ticketPrice is the only thing in dollars always
                        value.amount /= 1000;
                    }
                });
            } else {
                ft[attrs[j]] = t[attrs[j]];
            }
        }
    };

    // Filters s by seasonAttrs (which should be options.seasonAttrs) into ft. This is to do one season of seasonAttrs filtering.
    const filterSeasonAttrsPartial = (ft: any, tsa: TeamSeason, seasonAttrs) => {
        // For cases when the deleteOldData feature is used
        if (tsa === undefined) {
            return ft;
        }

        // Revenue and expenses calculation
        tsa.revenue = _.reduce(tsa.revenues, (memo, revenue) => memo + revenue.amount, 0);
        tsa.expense = _.reduce(tsa.expenses, (memo, expense) => memo + expense.amount, 0);

        for (let j = 0; j < seasonAttrs.length; j++) {
            if (seasonAttrs[j] === "winp") {
                ft.winp = 0;
                if (tsa.won + tsa.lost > 0) {
                    ft.winp = tsa.won / (tsa.won + tsa.lost);
                }
            } else if (seasonAttrs[j] === "att") {
                ft.att = 0;
                if (!tsa.hasOwnProperty("gpHome")) { tsa.gpHome = Math.round(tsa.gp / 2); } // See also game.js and teamFinances.js
                if (tsa.gpHome > 0) {
                    ft.att = tsa.att / tsa.gpHome;
                }
            } else if (seasonAttrs[j] === "cash") {
                ft.cash = tsa.cash / 1000;  // [millions of dollars]
            } else if (seasonAttrs[j] === "revenue") {
                ft.revenue = tsa.revenue / 1000;  // [millions of dollars]
            } else if (seasonAttrs[j] === "profit") {
                ft.profit = (tsa.revenue - tsa.expense) / 1000;  // [millions of dollars]
            } else if (seasonAttrs[j] === "salaryPaid") {
                ft.salaryPaid = tsa.expenses.salary.amount / 1000;  // [millions of dollars]
            } else if (seasonAttrs[j] === "payroll") {
                // Handled later
                ft.payroll = null;
            } else if (seasonAttrs[j] === "lastTen") {
                const lastTenWon = tsa.lastTen.reduce((memo, num) => memo + num, 0);
                const lastTenLost = tsa.lastTen.length - lastTenWon;
                ft.lastTen = `${lastTenWon}-${lastTenLost}`;
            } else if (seasonAttrs[j] === "streak") {  // For standings
                if (tsa.streak === 0) {
                    ft.streak = "None";
                } else if (tsa.streak > 0) {
                    ft.streak = `Won ${tsa.streak}`;
                } else if (tsa.streak < 0) {
                    ft.streak = `Lost ${Math.abs(tsa.streak)}`;
                }
            } else {
                ft[seasonAttrs[j]] = tsa[seasonAttrs[j]];
            }
        }

        return ft;
    };

    // Copys/filters the seasonal attributes listed in options.seasonAttrs from p to fp.
    const filterSeasonAttrs = (ft: any, t, {season, seasonAttrs}) => {
        let ts;
        if (seasonAttrs.length > 0) {
            if (season !== null) {
                // Single season
                for (let j = 0; j < t.seasons.length; j++) {
                    if (t.seasons[j].season === season) {
                        ts = t.seasons[j];
                        break;
                    }
                }
            } else {
                // Multiple seasons
                ts = t.seasons;
            }
        }

        if (ts !== undefined && ts.length >= 0) {
            ft.seasons = [];
            // Multiple seasons
            for (let i = 0; i < ts.length; i++) {
                ft.seasons.push(filterSeasonAttrsPartial({}, ts[i], seasonAttrs));
            }
        } else {
            // Single seasons - merge stats with root object
            ft = filterSeasonAttrsPartial(ft, ts, seasonAttrs);
        }
    };

    // Filters s by stats (which should be options.stats) into ft. This is to do one season of stats filtering.
    const filterStatsPartial = (ft: any, s: TeamStats, stats) => {
        if (s !== undefined && s.gp > 0) {
            for (let j = 0; j < stats.length; j++) {
                if (stats[j] === "gp") {
                    ft.gp = s.gp;
                } else if (stats[j] === "fgp") {
                    if (s.fga > 0) {
                        ft.fgp = 100 * s.fg / s.fga;
                    } else {
                        ft.fgp = 0;
                    }
                } else if (stats[j] === "fgpAtRim") {
                    if (s.fgaAtRim > 0) {
                        ft.fgpAtRim = 100 * s.fgAtRim / s.fgaAtRim;
                    } else {
                        ft.fgpAtRim = 0;
                    }
                } else if (stats[j] === "fgpLowPost") {
                    if (s.fgaLowPost > 0) {
                        ft.fgpLowPost = 100 * s.fgLowPost / s.fgaLowPost;
                    } else {
                        ft.fgpLowPost = 0;
                    }
                } else if (stats[j] === "fgpMidRange") {
                    if (s.fgaMidRange > 0) {
                        ft.fgpMidRange = 100 * s.fgMidRange / s.fgaMidRange;
                    } else {
                        ft.fgpMidRange = 0;
                    }
                } else if (stats[j] === "tpp") {
                    if (s.tpa > 0) {
                        ft.tpp = 100 * s.tp / s.tpa;
                    } else {
                        ft.tpp = 0;
                    }
                } else if (stats[j] === "ftp") {
                    if (s.fta > 0) {
                        ft.ftp = 100 * s.ft / s.fta;
                    } else {
                        ft.ftp = 0;
                    }
                } else if (stats[j] === "diff") {
                    ft.diff = ft.pts - ft.oppPts;
                } else if (stats[j] === "season") {
                    ft.season = s.season;
                } else if (options.totals) {
                    ft[stats[j]] = s[stats[j]];
                } else {
                    ft[stats[j]] = s[stats[j]] / s.gp;
                }
            }
        } else {
            for (let j = 0; j < stats.length; j++) {
                if (stats[j] === "season") {
                    ft.season = s.season;
                } else {
                    ft[stats[j]] = 0;
                }
            }
        }

        return ft;
    };

    // Copys/filters the stats listed in options.stats from p to fp.
    const filterStats = (ft, t, {playoffs, season, stats}) => {
        let ts;
        if (stats.length > 0) {
            if (season !== null) {
                // Single season
                for (let j = 0; j < t.stats.length; j++) {
                    if (t.stats[j].season === season && t.stats[j].playoffs === playoffs) {
                        ts = t.stats[j];
                        break;
                    }
                }
            } else {
                // Multiple seasons
                ts = [];
                for (let j = 0; j < t.stats.length; j++) {
                    if (t.stats[j].playoffs === playoffs) {
                        ts.push(t.stats[j]);
                    }
                }
            }
        }

        if (ts !== undefined && ts.length >= 0) {
            ft.stats = [];
            // Multiple seasons
            for (let i = 0; i < ts.length; i++) {
                ft.stats.push(filterStatsPartial({}, ts[i], stats));
            }
        } else {
            // Single seasons - merge stats with root object
            ft = filterStatsPartial(ft, ts, stats);
        }
    };

    return helpers.maybeReuseTx(["players", "releasedPlayers", "teams", "teamSeasons", "teamStats"], "readonly", options.ot, async tx => {
        const teams = await tx.teams.getAll(options.tid).map(async t => {
            let seasonsPromise;
            if (options.seasonAttrs.length === 0) {
                seasonsPromise = Promise.resolve([]);
            } else if (options.season === null) {
                seasonsPromise = tx.teamSeasons.index("tid, season").getAll(backboard.bound([t.tid], [t.tid, '']));
            } else {
                seasonsPromise = tx.teamSeasons.index("season, tid").getAll([options.season, t.tid]);
            }

            let statsPromise;
            if (options.stats.length === 0) {
                statsPromise = Promise.resolve([]);
            } else if (options.season === null) {
                statsPromise = tx.teamStats.index("tid").getAll(t.tid);
            } else {
                statsPromise = tx.teamStats.index("season, tid").getAll([options.season, t.tid]);
            }

            const [seasons, stats] = await Promise.all([
                seasonsPromise,
                statsPromise,
            ]);
            t.seasons = orderBy(seasons, "season");
            t.stats = orderBy(stats, ["season", "playoffs"]);
            return t;
        });

        // teams will be an array of g.numTeams teams (if options.tid is null) or an array of 1 team. If 1, then we want to return just that team object at the end, not an array of 1 team.
        const returnOneTeam = teams.length === 1;

        const fts = teams.map(t => {
            const ft = {};
            filterAttrs(ft, t, options);
            filterSeasonAttrs(ft, t, options);
            filterStats(ft, t, options);
            return ft;
        });

        if (Array.isArray(options.sortBy)) {
            // Sort by multiple properties
            const sortBy = options.sortBy.slice();
            fts.sort((a, b) => {
                let result;
                for (let i = 0; i < sortBy.length; i++) {
                    result = (sortBy[i].indexOf("-") === 1) ? a[sortBy[i]] - b[sortBy[i]] : b[sortBy[i]] - a[sortBy[i]];

                    if (result || i === sortBy.length - 1) {
                        return result;
                    }
                }
            });
        } else if (options.sortBy === "winp") {
            // Sort by winning percentage, descending
            fts.sort((a, b) => b.winp - a.winp);
        }

        // If payroll for the current season was requested, find the current payroll for each team. Otherwise, don't.
        if (!options.seasonAttrs.includes('payroll') || options.season !== g.season) {
            return returnOneTeam ? fts[0] : fts;
        }

        const savePayroll = async i => {
            const payroll = await getPayroll(teams[i].tid).get(0);
            fts[i].payroll = payroll / 1000;
            if (i === fts.length - 1) {
                return returnOneTeam ? fts[0] : fts;
            }

            return savePayroll(i + 1);
        };

        return savePayroll(0);
    });
}

// estValuesCached is either a copy of estValues (defined below) or null. When it's cached, it's much faster for repeated calls (like trading block).
async function valueChange(
    tid: number,
    pidsAdd: number[],
    pidsRemove: number[],
    dpidsAdd: number[],
    dpidsRemove: number[],
    estValuesCached?: TradePickValues,
): Promise<number> {
    // UGLY HACK: Don't include more than 2 draft picks in a trade for AI team
    if (dpidsRemove.length > 2) {
        return -1;
    }

    // Get value and skills for each player on team or involved in the proposed transaction
    const roster = [];
    let add = [];
    let remove = [];

    let gpAvg;
    let payroll;
    let pop;
    let strategy;
    await g.dbl.tx(["players", "releasedPlayers", "teams", "teamSeasons", "teamStats"], async tx => {
        // Get players
        const getPlayers = async () => {
            // Fudge factor for AI overvaluing its own players
            const fudgeFactor = tid !== g.userTid ? 1.05 : 1;

            // Get roster and players to remove
            const players = await tx.players.index('tid').getAll(tid);
            for (let i = 0; i < players.length; i++) {
                const p = players[i];
                if (!pidsRemove.includes(p.pid)) {
                    roster.push({
                        value: p.value,
                        skills: _.last(p.ratings).skills,
                        contract: p.contract,
                        worth: player.genContract(p, false, false, true),
                        injury: p.injury,
                        age: g.season - p.born.year,
                    });
                } else {
                    remove.push({
                        value: p.value * fudgeFactor,
                        skills: _.last(p.ratings).skills,
                        contract: p.contract,
                        worth: player.genContract(p, false, false, true),
                        injury: p.injury,
                        age: g.season - p.born.year,
                    });
                }
            }

            // Get players to add
            for (let i = 0; i < pidsAdd.length; i++) {
                const p = await tx.players.get(pidsAdd[i]);
                add.push({
                    value: p.valueWithContract,
                    skills: _.last(p.ratings).skills,
                    contract: p.contract,
                    worth: player.genContract(p, false, false, true),
                    injury: p.injury,
                    age: g.season - p.born.year,
                });
            }
        };

        const getPicks = async () => {
            // For each draft pick, estimate its value based on the recent performance of the team
            if (dpidsAdd.length > 0 || dpidsRemove.length > 0) {
                // Estimate the order of the picks by team
                const allTeamSeasons = await tx.teamSeasons.index("season, tid").getAll(backboard.bound([g.season - 1], [g.season, '']));

                // This part needs to be run every time so that gpAvg is available
                const wps = []; // Contains estimated winning percentages for all teams by the end of the season

                let gp;
                for (let tid2 = 0; tid2 < g.numTeams; tid2++) {
                    const teamSeasons = allTeamSeasons.filter(teamSeason => teamSeason.tid === tid2);
                    const s = teamSeasons.length;

                    let rCurrent;
                    let rLast;
                    if (teamSeasons.length === 1) {
                        // First season
                        if (teamSeasons[0].won + teamSeasons[0].lost > 15) {
                            rCurrent = [teamSeasons[0].won, teamSeasons[0].lost];
                        } else {
                            // Fix for new leagues - don't base this on record until we have some games played, and don't let the user's picks be overvalued
                            rCurrent = tid2 === g.userTid ? [g.numGames, 0] : [0, g.numGames];
                        }

                        if (tid2 === g.userTid) {
                            rLast = [Math.round(0.6 * g.numGames), Math.round(0.4 * g.numGames)];
                        } else {
                            // Assume a losing season to minimize bad trades
                            rLast = [Math.round(0.4 * g.numGames), Math.round(0.6 * g.numGames)];
                        }
                    } else {
                        // Second (or higher) season
                        rCurrent = [teamSeasons[s - 1].won, teamSeasons[s - 1].lost];
                        rLast = [teamSeasons[s - 2].won, teamSeasons[s - 2].lost];
                    }

                    gp = rCurrent[0] + rCurrent[1]; // Might not be "real" games played

                    // If we've played half a season, just use that as an estimate. Otherwise, take a weighted sum of this and last year
                    const halfSeason = Math.round(0.5 * g.numGames);
                    if (gp >= halfSeason) {
                        wps.push(rCurrent[0] / gp);
                    } else if (gp > 0) {
                        wps.push((gp / halfSeason * rCurrent[0] / gp + (halfSeason - gp) / halfSeason * rLast[0] / g.numGames));
                    } else {
                        wps.push(rLast[0] / g.numGames);
                    }
                }

                // Get rank order of wps http://stackoverflow.com/a/14834599/786644
                const sorted = wps.slice().sort((a, b) => a - b);
                const estPicks = wps.slice().map(v => sorted.indexOf(v) + 1); // For each team, what is their estimated draft position?

                const rookieSalaries = draft.getRookieSalaries();

                // Actually add picks after some stuff below is done
                let estValues;
                const withEstValues = () => {
                    Promise.all(dpidsAdd.map(async (dpid) => {
                        const dp = await g.cache.get('draftPicks', dpid);

                        let estPick = estPicks[dp.originalTid];

                        // For future draft picks, add some uncertainty
                        const seasons = dp.season - g.season;
                        estPick = Math.round(estPick * (5 - seasons) / 5 + 15 * seasons / 5);

                        // No fudge factor, since this is coming from the user's team (or eventually, another AI)
                        let value;
                        if (estValues[dp.season]) {
                            value = estValues[dp.season][estPick - 1 + g.numTeams * (dp.round - 1)];
                        }
                        if (!value) {
                            value = estValues.default[estPick - 1 + g.numTeams * (dp.round - 1)];
                        }

                        add.push({
                            value,
                            skills: [],
                            contract: {
                                amount: rookieSalaries[estPick - 1 + g.numTeams * (dp.round - 1)],
                                exp: dp.season + 2 + (2 - dp.round), // 3 for first round, 2 for second
                            },
                            worth: {
                                amount: rookieSalaries[estPick - 1 + g.numTeams * (dp.round - 1)],
                                exp: dp.season + 2 + (2 - dp.round), // 3 for first round, 2 for second
                            },
                            injury: {type: "Healthy", gamesRemaining: 0},
                            age: 19,
                            draftPick: true,
                        });
                    }));

                    Promise.all(dpidsRemove.map(async (dpid) => {
                        const dp = await g.cache.get('draftPicks', dpid);
                        let estPick = estPicks[dp.originalTid];

                        // For future draft picks, add some uncertainty
                        const seasons = dp.season - g.season;
                        estPick = Math.round(estPick * (5 - seasons) / 5 + 15 * seasons / 5);

                        // Set fudge factor with more confidence if it's the current season
                        let fudgeFactor;
                        if (seasons === 0 && gp >= g.numGames / 2) {
                            fudgeFactor = (1 - gp / g.numGames) * 5;
                        } else {
                            fudgeFactor = 5;
                        }

                        // Use fudge factor: AI teams like their own picks
                        let value;
                        if (estValues[dp.season]) {
                            value = estValues[dp.season][estPick - 1 + g.numTeams * (dp.round - 1)] + (tid !== g.userTid ? 1 : 0) * fudgeFactor;
                        }
                        if (!value) {
                            value = estValues.default[estPick - 1 + g.numTeams * (dp.round - 1)] + (tid !== g.userTid ? 1 : 0) * fudgeFactor;
                        }

                        remove.push({
                            value,
                            skills: [],
                            contract: {
                                amount: rookieSalaries[estPick - 1 + g.numTeams * (dp.round - 1)] / 1000,
                                exp: dp.season + 2 + (2 - dp.round), // 3 for first round, 2 for second
                            },
                            worth: {
                                amount: rookieSalaries[estPick - 1 + g.numTeams * (dp.round - 1)] / 1000,
                                exp: dp.season + 2 + (2 - dp.round), // 3 for first round, 2 for second
                            },
                            injury: {type: "Healthy", gamesRemaining: 0},
                            age: 19,
                            draftPick: true,
                        });
                    }));
                };

                if (estValuesCached) {
                    estValues = estValuesCached;
                } else {
                    estValues = await trade.getPickValues(tx);
                }
                withEstValues();
            }
        };

        // Get team strategy and population, for future use
        const t = await filter({
            attrs: ["strategy"],
            seasonAttrs: ["pop"],
            stats: ["gp"],
            season: g.season,
            tid,
            ot: tx,
        });

        strategy = t.strategy;
        pop = t.pop;
        if (pop > 20) {
            pop = 20;
        }
        gpAvg = helpers.bound(t.gp, 0, g.numGames); // Ideally would be done separately for each team, but close enough

        getPlayers();
        getPicks();

        payroll = await getPayroll(tid);
    });

/*    // Handle situations where the team goes over the roster size limit
    if (roster.length + remove.length > 15) {
        // Already over roster limit, so don't worry unless this trade actually makes it worse
        needToDrop = (roster.length + add.length) - (roster.length + remove.length);
    } else {
        needToDrop = (roster.length + add.length) - 15;
    }
    roster.sort((a, b) => a.value - b.value); // Sort by value, ascending
    add.sort((a, b) => a.value - b.value); // Sort by value, ascending
    while (needToDrop > 0) {
        // Find lowest value player, from roster or add. Delete him and move his salary to the second lowest value player.
        if (roster[0].value < add[0].value) {
            if (roster[1].value < add[0].value) {
                roster[1].contract.amount += roster[0].contract.amount;
            } else {
                add[0].contract.amount += roster[0].contract.amount;
            }
            roster.shift(); // Remove from value calculation
        } else {
            if (add.length > 1 && add[1].value < roster[0].value) {
                add[1].contract.amount += add[0].contract.amount;
            } else {
                roster[0].contract.amount += add[0].contract.amount;
            }
            add.shift(); // Remove from value calculation
        }

        needToDrop -= 1;
    }*/

    // This roughly corresponds with core.gameSim.updateSynergy
    const skillsNeeded = {
        '3': 5,
        A: 5,
        B: 3,
        Di: 2,
        Dp: 2,
        Po: 2,
        Ps: 4,
        R: 3,
    };

    const doSkillBonuses = (test, rosterLocal) => {
        // What are current skills?
        let rosterSkills = [];
        for (let i = 0; i < rosterLocal.length; i++) {
            if (rosterLocal[i].value >= 45) {
                rosterSkills.push(rosterLocal[i].skills);
            }
        }
        rosterSkills = _.flatten(rosterSkills);
        const rosterSkillsCount = _.countBy(rosterSkills);

        // Sort test by value, so that the highest value players get bonuses applied first
        test.sort((a, b) => b.value - a.value);

        for (let i = 0; i < test.length; i++) {
            if (test[i].value >= 45) {
                for (let j = 0; j < test[i].skills.length; j++) {
                    const s = test[i].skills[j];

                    if (rosterSkillsCount[s] <= skillsNeeded[s] - 2) {
                        // Big bonus
                        test[i].value *= 1.1;
                    } else if (rosterSkillsCount[s] <= skillsNeeded[s] - 1) {
                        // Medium bonus
                        test[i].value *= 1.05;
                    } else if (rosterSkillsCount[s] <= skillsNeeded[s]) {
                        // Little bonus
                        test[i].value *= 1.025;
                    }

                    // Account for redundancy in test
                    rosterSkillsCount[s] += 1;
                }
            }
        }

        return test;
    };

    // Apply bonuses based on skills coming in and leaving
    const rosterAndRemove = roster.concat(remove);
    const rosterAndAdd = roster.concat(add);
    add = doSkillBonuses(add, rosterAndRemove);
    remove = doSkillBonuses(remove, rosterAndAdd);

    // This actually doesn't do anything because I'm an idiot
    const base = 1.25;

    const sumValues = (players, includeInjuries) => {
        includeInjuries = includeInjuries !== undefined ? includeInjuries : false;

        if (players.length === 0) {
            return 0;
        }

        const exponential = players.reduce((memo, p) => {
            let playerValue = p.value;

            if (strategy === "rebuilding") {
                // Value young/cheap players and draft picks more. Penalize expensive/old players
                if (p.draftPick) {
                    playerValue *= 1.15;
                } else if (p.age <= 19) {
                    playerValue *= 1.15;
                } else if (p.age === 20) {
                    playerValue *= 1.1;
                } else if (p.age === 21) {
                    playerValue *= 1.075;
                } else if (p.age === 22) {
                    playerValue *= 1.05;
                } else if (p.age === 23) {
                    playerValue *= 1.025;
                } else if (p.age === 27) {
                    playerValue *= 0.975;
                } else if (p.age === 28) {
                    playerValue *= 0.95;
                } else if (p.age >= 29) {
                    playerValue *= 0.9;
                }
            }

            // Anything below 45 is pretty worthless
            playerValue -= 45;

            // Normalize for injuries
            if (includeInjuries && tid !== g.userTid) {
                if (p.injury.gamesRemaining > 75) {
                    playerValue -= playerValue * 0.75;
                } else {
                    playerValue -= playerValue * p.injury.gamesRemaining / 100;
                }
            }

            let contractValue = (p.worth.amount - p.contract.amount) / 1000;

            // Account for duration
            const contractSeasonsRemaining = player.contractSeasonsRemaining(p.contract.exp, g.numGames - gpAvg);
            if (contractSeasonsRemaining > 1) {
                // Don't make it too extreme
                contractValue *= contractSeasonsRemaining ** 0.25;
            } else {
                // Raising < 1 to < 1 power would make this too large
                contractValue *= contractSeasonsRemaining;
            }

            // Really bad players will just get no PT
            if (playerValue < 0) {
                playerValue = 0;
            }
//console.log([playerValue, contractValue]);

            const value = playerValue + 0.5 * contractValue;

            if (value === 0) {
                return memo;
            }
            return memo + (Math.abs(value) ** base) * Math.abs(value) / value;
        }, 0);

        if (exponential === 0) {
            return exponential;
        }
        return (Math.abs(exponential) ** (1 / base)) * Math.abs(exponential) / exponential;
    };

    // Sum of contracts
    // If onlyThisSeason is set, then amounts after this season are ignored and the return value is the sum of this season's contract amounts in millions of dollars
    const sumContracts = (players, onlyThisSeason) => {
        onlyThisSeason = onlyThisSeason !== undefined ? onlyThisSeason : false;

        if (players.length === 0) {
            return 0;
        }

        return players.reduce((memo, p) => {
            if (p.draftPick) {
                return memo;
            }

            return memo + p.contract.amount / 1000 * (player.contractSeasonsRemaining(p.contract.exp, g.numGames - gpAvg) ** (0.25 - (onlyThisSeason ? 0.25 : 0)));
        }, 0);
    };

    const contractsFactor = strategy === "rebuilding" ? 0.3 : 0.1;

    const salaryRemoved = sumContracts(remove) - sumContracts(add);

    let dv = sumValues(add, true) - sumValues(remove) + contractsFactor * salaryRemoved;
/*console.log("Added players/picks: " + sumValues(add, true));
console.log("Removed players/picks: " + (-sumValues(remove)));
console.log("Added contract quality: -" + contractExcessFactor + " * " + sumContractExcess(add));
console.log("Removed contract quality: -" + contractExcessFactor + " * " + sumContractExcess(remove));
console.log("Total contract amount: " + contractsFactor + " * " + salaryRemoved);*/

    // Aversion towards losing cap space in a trade during free agency
    if (g.phase >= g.PHASE.RESIGN_PLAYERS || g.phase <= g.PHASE.FREE_AGENCY) {
        // Only care if cap space is over 2 million
        if (payroll + 2000 < g.salaryCap) {
            const salaryAddedThisSeason = sumContracts(add, true) - sumContracts(remove, true);
            // Only care if cap space is being used
            if (salaryAddedThisSeason > 0) {
//console.log("Free agency penalty: -" + (0.2 + 0.8 * g.daysLeft / 30) * salaryAddedThisSeason);
                dv -= (0.2 + 0.8 * g.daysLeft / 30) * salaryAddedThisSeason; // 0.2 to 1 times the amount, depending on stage of free agency
            }
        }
    }

    // Normalize for number of players, since 1 really good player is much better than multiple mediocre ones
    // This is a fudge factor, since it's one-sided to punish the player
    if (add.length > remove.length) {
        dv -= add.length - remove.length;
    }

    return dv;
/*console.log('---');
console.log([sumValues(add), sumContracts(add)]);
console.log([sumValues(remove), sumContracts(remove)]);
console.log(dv);*/
}

/**
 * Update team strategies (contending or rebuilding) for every team in the league.
 *
 * Basically.. switch to rebuilding if you're old and your success is fading, and switch to contending if you have a good amount of young talent on rookie deals and your success is growing.
 *
 * @memberOf core.team
 * @return {Promise}
 */
async function updateStrategies() {
    const teams = await g.cache.getAll('teams');
    for (const t of teams) {
        // Skip user's team
        if (t.tid === g.userTid) {
            continue;
        }

        // Change in wins
        const teamSeason = await g.cache.indexGet('teamSeasonsBySeasonTid', `${g.season},${t.tid}`);
        const teamSeasonOld = await g.cache.indexGet('teamSeasonsBySeasonTid', `${g.season - 1},${t.tid}`);

        const won = teamSeason.won;
        const dWon = teamSeasonOld ? won - teamSeasonOld.won : 0;

        // Young stars
        let players = await g.cache.indexGetAll('playersByTid', t.tid);
        players = await getCopy.players(players, {
            season: g.season,
            tid: t.tid,
            attrs: ["age", "value", "contract"],
            stats: ["min"],
        });

        let youngStar = 0; // Default value

        let numerator = 0; // Sum of age * mp
        let denominator = 0; // Sum of mp
        for (let i = 0; i < players.length; i++) {
            numerator += players[i].age * players[i].stats.min;
            denominator += players[i].stats.min;

            // Is a young star about to get a pay raise and eat up all the cap after this season?
            if (players[i].value > 65 && players[i].contract.exp === g.season + 1 && players[i].contract.amount <= 5 && players[i].age <= 25) {
                youngStar += 1;
            }
        }

        const age = numerator / denominator; // Average age, weighted by minutes played
        const score = 0.8 * dWon + (won - g.numGames / 2) + 5 * (26 - age) + youngStar * 20;

        if (score > 20 && t.strategy === "rebuilding") {
            t.strategy = "contending";
        } else if (score < -20 && t.strategy === "contending") {
            t.strategy = "rebuilding";
        }
    }
}

/**
 * Check roster size limits
 *
 * If any AI team is over the maximum roster size, cut their worst players.
 * If any AI team is under the minimum roster size, sign minimum contract
 * players until the limit is reached. If the user's team is breaking one of
 * these roster size limits, display a warning.
 *
 * @memberOf core.team
 * @return {Promise.?string} Resolves to null if there is no error, or a string with the error message otherwise.
 */
function checkRosterSizes(): Promise<string | null> {
    return g.dbl.tx(["players", "playerStats", "releasedPlayers", "teams", "teamSeasons"], "readwrite", async tx => {
        const minFreeAgents = [];
        let userTeamSizeError = null;

        const checkRosterSize = async tid => {
            const players = await tx.players.index('tid').getAll(tid);
            let numPlayersOnRoster = players.length;
            if (numPlayersOnRoster > 15) {
                if (g.userTids.includes(tid) && g.autoPlaySeasons === 0) {
                    if (g.userTids.length <= 1) {
                        userTeamSizeError = 'Your team has ';
                    } else {
                        userTeamSizeError = `The ${g.teamRegionsCache[tid]} ${g.teamNamesCache[tid]} have `;
                    }
                    userTeamSizeError += `more than the maximum number of players (15). You must remove players (by <a href="${helpers.leagueUrl(["roster"])}">releasing them from your roster</a> or through <a href="${helpers.leagueUrl(["trade"])}">trades</a>) before continuing.`;
                } else {
                    // Automatically drop lowest value players until we reach 15
                    players.sort((a, b) => a.value - b.value); // Lowest first
                    const promises = [];
                    for (let i = 0; i < (numPlayersOnRoster - 15); i++) {
                        promises.push(player.release(tx, players[i], false));
                    }
                    await Promise.all(promises);
                }
            } else if (numPlayersOnRoster < g.minRosterSize) {
                if (g.userTids.includes(tid) && g.autoPlaySeasons === 0) {
                    if (g.userTids.length <= 1) {
                        userTeamSizeError = 'Your team has ';
                    } else {
                        userTeamSizeError = `The ${g.teamRegionsCache[tid]} ${g.teamNamesCache[tid]} have `;
                    }
                    userTeamSizeError += `less than the minimum number of players (${g.minRosterSize}). You must add players (through <a href="${helpers.leagueUrl(["free_agents"])}">free agency</a> or <a href="${helpers.leagueUrl(["trade"])}">trades</a>) before continuing.<br><br>Reminder: you can always sign free agents to ${helpers.formatCurrency(g.minContract / 1000, "M", 1)}/yr contracts, even if you're over the cap!`;
                } else {
                    // Auto-add players
                    const promises = [];
                    while (numPlayersOnRoster < g.minRosterSize) {
                        // See also core.phase
                        const p = minFreeAgents.shift();
                        p.tid = tid;
                        await player.addStatsRow(p, g.phase === g.PHASE.PLAYOFFS);
                        player.setContract(p, p.contract, true);
                        p.gamesUntilTradable = 15;

                        logEvent({
                            type: "freeAgent",
                            text: `The <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[p.tid], g.season])}">${g.teamNamesCache[p.tid]}</a> signed <a href="${helpers.leagueUrl(["player", p.pid])}">${p.firstName} ${p.lastName}</a> for ${helpers.formatCurrency(p.contract.amount / 1000, "M")}/year through ${p.contract.exp}.`,
                            showNotification: false,
                            pids: [p.pid],
                            tids: [p.tid],
                        });

                        promises.push(tx.players.put(p));

                        numPlayersOnRoster += 1;
                    }
                    await Promise.all(promises);
                }
            }

            // Auto sort rosters (except player's team)
            // This will sort all AI rosters before every game. Excessive? It could change some times, but usually it won't
            if (!g.userTids.includes(tid) || g.autoPlaySeasons > 0) {
                return rosterAutoSort(tid);
            }
        };

        const players = await tx.players.index('tid').getAll(g.PLAYER.FREE_AGENT);

        // List of free agents looking for minimum contracts, sorted by value. This is used to bump teams up to the minimum roster size.
        for (let i = 0; i < players.length; i++) {
            if (players[i].contract.amount === g.minContract) {
                minFreeAgents.push(players[i]);
            }
        }
        minFreeAgents.sort((a, b) => b.value - a.value);

        // Make sure teams are all within the roster limits
        const promises = [];
        for (let i = 0; i < g.numTeams; i++) {
            promises.push(checkRosterSize(i));
        }
        await Promise.all(promises);

        return userTeamSizeError;
    });
}

export {
    genSeasonRow,
    genStatsRow,
    generate,
    findStarters,
    rosterAutoSort,
    filter,
    valueChange,
    updateStrategies,
    checkRosterSizes,
    getPayroll,
    getPayrolls,
};
