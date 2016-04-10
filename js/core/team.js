/**
 * @name core.team
 * @namespace Functions operating on team objects, parts of team objects, or arrays of team objects.
 */
'use strict';

var g = require('../globals');
var player = require('./player');
var Promise = require('bluebird');
var _ = require('underscore');
var eventLog = require('../util/eventLog');
var helpers = require('../util/helpers');
var random = require('../util/random');
var sortBy = require('lodash.sortby');

function genSeasonRow(tid, prevSeason) {
    var newSeason;

    // Initial entry
    newSeason = {
        tid: tid,
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
        playoffRoundsWon: -1,  // -1: didn't make playoffs. 0: lost in first round. ... 4: won championship
        hype: Math.random(),
        pop: 0,  // Needs to be set somewhere!
        tvContract: {
            amount: 0,
            exp: 0
        },
        revenues: {
            merch: {
                amount: 0,
                rank: 15.5
            },
            sponsor: {
                amount: 0,
                rank: 15.5
            },
            ticket: {
                amount: 0,
                rank: 15.5
            },
            nationalTv: {
                amount: 0,
                rank: 15.5
            },
            localTv: {
                amount: 0,
                rank: 15.5
            }
        },
        expenses: {
            salary: {
                amount: 0,
                rank: 15.5
            },
            luxuryTax: {
                amount: 0,
                rank: 15.5
            },
            minTax: {
                amount: 0,
                rank: 15.5
            },
            buyOuts: {
                amount: 0,
                rank: 15.5
            },
            scouting: {
                amount: 0,
                rank: 15.5
            },
            coaching: {
                amount: 0,
                rank: 15.5
            },
            health: {
                amount: 0,
                rank: 15.5
            },
            facilities: {
                amount: 0,
                rank: 15.5
            }
        },
        payrollEndOfSeason: -1
    };

    if (prevSeason) {
        // New season, carrying over some values from the previous season
        newSeason.pop = prevSeason.pop * random.uniform(0.98, 1.02);  // Mean population should stay constant, otherwise the economics change too much
        newSeason.hype = prevSeason.hype;
        newSeason.cash = prevSeason.cash;
        newSeason.tvContract = prevSeason.tvContract;
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
function genStatsRow(tid, playoffs) {
    playoffs = playoffs !== undefined ? playoffs : false;

    return {
        tid: tid,
        season: g.season,
        playoffs: playoffs,
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
        oppPts: 0
    };
}

/**
 * Create a new team object.
 *
 * @memberOf core.team
 * @param {Object} tm Team metadata object, likely from core.league.create.
 * @return {Object} Team object to insert in the database.
 */
function generate(tm) {
    var strategy, t;

    if (tm.hasOwnProperty("strategy")) {
        strategy = tm.strategy;
    } else {
        strategy = Math.random() > 0.5 ? "contending" : "rebuilding";
    }

    t = {
        tid: tm.tid,
        cid: tm.cid,
        did: tm.did,
        region: tm.region,
        name: tm.name,
        abbrev: tm.abbrev,
        imgURL: tm.imgURL !== undefined ? tm.imgURL : "",
        budget: {
            ticketPrice: {
                amount: tm.hasOwnProperty("budget") ? tm.budget.ticketPrice.amount : helpers.round(25 + 25 * (g.numTeams - tm.popRank) / (g.numTeams - 1), 2),
                rank: tm.hasOwnProperty("budget") ? tm.budget.ticketPrice.rank : tm.popRank
            },
            scouting: {
                amount: tm.hasOwnProperty("budget") ? tm.budget.scouting.amount : helpers.round(900 + 900 * (g.numTeams - tm.popRank) / (g.numTeams - 1)) * 10,
                rank: tm.hasOwnProperty("budget") ? tm.budget.scouting.rank : tm.popRank
            },
            coaching: {
                amount: tm.hasOwnProperty("budget") ? tm.budget.coaching.amount : helpers.round(900 + 900 * (g.numTeams - tm.popRank) / (g.numTeams - 1)) * 10,
                rank: tm.hasOwnProperty("budget") ? tm.budget.coaching.rank : tm.popRank
            },
            health: {
                amount: tm.hasOwnProperty("budget") ? tm.budget.health.amount : helpers.round(900 + 900 * (g.numTeams - tm.popRank) / (g.numTeams - 1)) * 10,
                rank: tm.hasOwnProperty("budget") ? tm.budget.health.rank : tm.popRank
            },
            facilities: {
                amount: tm.hasOwnProperty("budget") ? tm.budget.facilities.amount : helpers.round(900 + 900 * (g.numTeams - tm.popRank) / (g.numTeams - 1)) * 10,
                rank: tm.hasOwnProperty("budget") ? tm.budget.facilities.rank : tm.popRank
            }
        },
        strategy: strategy
    };

    return t;
}

/**
 * Given a list of players sorted by ability, find the starters.
 *
 *
 * @param  {[type]} players [description]
 * @param {Array.<string>} p Array positions of players on roster, sorted by value already.
 * @return {Array.<number>} Indexes of the starters from the input array. If this is of length < 5, then satisfactory starters couldn't be found and any players should be used to fill in the starting lineup.
 */
function findStarters(positions) {
    var i, numC, numFC, numG, starters;

    starters = []; // Will be less than 5 in length if that's all it takes to meet requirements
    numG = 0;
    numFC = 0;
    numC = 0;
    for (i = 0; i < positions.length; i++) {
        if (starters.length === 5 || (numG >= 2 && numFC >= 2)) { break; }

        // Make sure we can get 2 G and 2 F/C
        if ((5 - starters.length > ((2 - numG) > 0 ? (2 - numG) : 0) + ((2 - numFC) > 0 ? (2 - numFC) : 0)) ||
                (numG < 2 && positions[i].indexOf('G') >= 0) ||
                (numFC < 2 && (positions[i].indexOf('F') >= 0 || (positions[i] === 'C' && numC === 0)))) {
            starters.push(i);
            numG += positions[i].indexOf('G') >= 0 ? 1 : 0;
            numFC += (positions[i].indexOf('F') >= 0 || positions[i] === 'C') ? 1 : 0;
            numC += positions[i] === 'C' ? 1 : 0;
        }
    }

    // Fill in after meeting requirements, but still not too many Cs!
    for (i = 0; i < positions.length; i++) {
        if (starters.length === 5) { break; }
        if (starters.indexOf(i) >= 0) { continue; }
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
 * @param {IDBTransaction} tx An IndexedDB transaction on players readwrite.
 * @param {number} tid Team ID.
 * @return {Promise}
 */
function rosterAutoSort(tx, tid) {
    // Get roster and sort by value (no potential included)
    return tx.players.index('tid').getAll(tid).then(function (players) {
        var i, newPlayers, positions, starters;

        players = player.filter(players, {
            attrs: ["pid", "valueNoPot", "valueNoPotFuzz"],
            ratings: ["pos"],
            season: g.season,
            showNoStats: true,
            showRookies: true
        });
        // Fuzz only for user's team
        if (tid === g.userTid) {
            players.sort(function (a, b) { return b.valueNoPotFuzz - a.valueNoPotFuzz; });
        } else {
            players.sort(function (a, b) { return b.valueNoPot - a.valueNoPot; });
        }

        // Shuffle array so that position conditions are met - 2 G and 2 F/C in starting lineup, at most one pure C
        positions = players.map(function (p) {
            return p.ratings.pos;
        });
        starters = findStarters(positions);
        newPlayers = starters.map(function (i) {
            return players[i];
        });
        for (i = 0; i < players.length; i++) {
            if (starters.indexOf(i) < 0) {
                newPlayers.push(players[i]);
            }
        }
        players = newPlayers;

        for (i = 0; i < players.length; i++) {
            players[i].rosterOrder = i;
        }

        // Update rosterOrder
        return tx.players.index('tid')
            .iterate(tid, function (p) {
                var i;

                for (i = 0; i < players.length; i++) {
                    if (players[i].pid === p.pid) {
                        if (p.rosterOrder !== players[i].rosterOrder) {
                            // Only write to DB if this actually changes
                            p.rosterOrder = players[i].rosterOrder;
                            return p;
                        }
                        break;
                    }
                }
            });
    });
}

/**
* Gets all the contracts a team owes.
*
* This includes contracts for players who have been released but are still owed money.
*
* @memberOf core.team
* @param {IDBTransaction} tx An IndexedDB transaction on players and releasedPlayers.
* @param {number} tid Team ID.
* @returns {Promise.Array} Array of objects containing contract information.
*/
function getContracts(tx, tid) {
    var contracts;

    // First, get players currently on the roster
    return tx.players.index('tid').getAll(tid).then(function (players) {
        var i;

        contracts = [];
        for (i = 0; i < players.length; i++) {
            contracts.push({
                pid: players[i].pid,
                name: players[i].name,
                skills: players[i].ratings[players[i].ratings.length - 1].skills,
                injury: players[i].injury,
                watch: players[i].watch !== undefined ? players[i].watch : false, // undefined check is for old leagues, can delete eventually
                amount: players[i].contract.amount,
                exp: players[i].contract.exp,
                released: false
            });
        }

        // Then, get any released players still owed money
        return tx.releasedPlayers.index('tid').getAll(tid);
    }).then(function (releasedPlayers) {
        if (releasedPlayers.length === 0) {
            return contracts;
        }

        return Promise.each(releasedPlayers, function (releasedPlayer) {
            return tx.players.get(releasedPlayer.pid).then(function (p) {
                if (p !== undefined) { // If a player is deleted, such as if the user deletes retired players to improve performance, this will be undefined
                    contracts.push({
                        pid: releasedPlayer.pid,
                        name: p.name,
                        skills: p.ratings[p.ratings.length - 1].skills,
                        injury: p.injury,
                        amount: releasedPlayer.contract.amount,
                        exp: releasedPlayer.contract.exp,
                        released: true
                    });
                } else {
                    contracts.push({
                        pid: releasedPlayer.pid,
                        name: "Deleted Player",
                        skills: [],
                        amount: releasedPlayer.contract.amount,
                        exp: releasedPlayer.contract.exp,
                        released: true
                    });
                }
            });
        }).then(function () {
            return contracts;
        });
    });
}

/**
 * Get the total current payroll for a team.
 *
 * This includes players who have been released but are still owed money from their old contracts.
 *
 * @memberOf core.team
 * @param {IDBTransaction|null} tx An IndexedDB transaction on players and releasedPlayers; if null is passed, then a new transaction will be used.
 * @param {number} tid Team ID.
 * @return {Promise.<number, Array=>} Resolves to an array; first argument is the payroll in thousands of dollars, second argument is the array of contract objects from tx.contracts.getAll.
 */
function getPayroll(tx, tid) {
    return helpers.maybeReuseTx(["players", "releasedPlayers"], "readonly", tx, function (tx) {
        return getContracts(tx, tid).then(function (contracts) {
            var i, payroll;

            payroll = 0;
            for (i = 0; i < contracts.length; i++) {
                payroll += contracts[i].amount;  // No need to check exp, since anyone without a contract for the current season will not have an entry
            }

            return [payroll, contracts];
        });
    });
}

/**
 * Get the total current payroll for every team team.
 *
 * @memberOf core.team
 * @param {IDBTransaction|null} ot An IndexedDB transaction on players and releasedPlayers; if null is passed, then a new transaction will be used.
 * @return {Promise} Resolves to an array of payrolls, ordered by team id.
 */
function getPayrolls(tx) {
    var promises, tid;

    return helpers.maybeReuseTx(["players", "releasedPlayers"], "readonly", tx, function (tx) {
        promises = [];
        for (tid = 0; tid < g.numTeams; tid++) {
            promises.push(getPayroll(tx, tid).get(0));
        }

        return Promise.all(promises);
    });
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
 * @param {string=} options.sortby Sorting method. "winp" sorts by descending winning percentage. If undefined, then teams are returned in order of their team IDs (which is alphabetical, currently).
 * @param {IDBTransaction|null=} options.ot An IndexedDB transaction on players, releasedPlayers, and teams; if null/undefined, then a new transaction will be used.
 * @return {Promise.(Object|Array.<Object>)} Filtered team object or array of filtered team objects, depending on the inputs.
 */
function filter(options) {
    var filterAttrs, filterSeasonAttrs, filterSeasonAttrsPartial, filterStats, filterStatsPartial;

    if (arguments[1] !== undefined) { throw new Error("No cb should be here"); }

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
    filterAttrs = function (ft, t, options) {
        var j;

        for (j = 0; j < options.attrs.length; j++) {
            if (options.attrs[j] === "budget") {
                ft.budget = helpers.deepCopy(t.budget);
                _.each(ft.budget, function (value, key) {
                    if (key !== "ticketPrice") {  // ticketPrice is the only thing in dollars always
                        value.amount /= 1000;
                    }
                });
            } else {
                ft[options.attrs[j]] = t[options.attrs[j]];
            }
        }
    };

    // Filters s by seasonAttrs (which should be options.seasonAttrs) into ft. This is to do one season of seasonAttrs filtering.
    filterSeasonAttrsPartial = function (ft, tsa, seasonAttrs) {
        var j, lastTenLost, lastTenWon;

        // For cases when the deleteOldData feature is used
        if (tsa === undefined) {
            return;
        }

        // Revenue and expenses calculation
        tsa.revenue = _.reduce(tsa.revenues, function (memo, revenue) { return memo + revenue.amount; }, 0);
        tsa.expense = _.reduce(tsa.expenses, function (memo, expense) { return memo + expense.amount; }, 0);

        for (j = 0; j < seasonAttrs.length; j++) {
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
                lastTenWon = _.reduce(tsa.lastTen, function (memo, num) { return memo + num; }, 0);
                lastTenLost = tsa.lastTen.length - lastTenWon;
                ft.lastTen = lastTenWon + "-" + lastTenLost;
            } else if (seasonAttrs[j] === "streak") {  // For standings
                if (tsa.streak === 0) {
                    ft.streak = "None";
                } else if (tsa.streak > 0) {
                    ft.streak = "Won " + tsa.streak;
                } else if (tsa.streak < 0) {
                    ft.streak = "Lost " + Math.abs(tsa.streak);
                }
            } else {
                ft[seasonAttrs[j]] = tsa[seasonAttrs[j]];
            }
        }

        return ft;
    };

    // Copys/filters the seasonal attributes listed in options.seasonAttrs from p to fp.
    filterSeasonAttrs = function (ft, t, options) {
        var i, j, ts;

        if (options.seasonAttrs.length > 0) {
            if (options.season !== null) {
                // Single season
                for (j = 0; j < t.seasons.length; j++) {
                    if (t.seasons[j].season === options.season) {
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
            for (i = 0; i < ts.length; i++) {
                ft.seasons.push(filterSeasonAttrsPartial({}, ts[i], options.seasonAttrs));
            }
        } else {
            // Single seasons - merge stats with root object
            ft = filterSeasonAttrsPartial(ft, ts, options.seasonAttrs);
        }
    };

    // Filters s by stats (which should be options.stats) into ft. This is to do one season of stats filtering.
    filterStatsPartial = function (ft, s, stats) {
        var j;

        if (s !== undefined && s.gp > 0) {
            for (j = 0; j < stats.length; j++) {
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
                } else {
                    if (options.totals) {
                        ft[stats[j]] = s[stats[j]];
                    } else {
                        ft[stats[j]] = s[stats[j]] / s.gp;
                    }
                }
            }
        } else {
            for (j = 0; j < stats.length; j++) {
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
    filterStats = function (ft, t, options) {
        var i, j, ts;

        if (options.stats.length > 0) {
            if (options.season !== null) {
                // Single season
                for (j = 0; j < t.stats.length; j++) {
                    if (t.stats[j].season === options.season && t.stats[j].playoffs === options.playoffs) {
                        ts = t.stats[j];
                        break;
                    }
                }
            } else {
                // Multiple seasons
                ts = [];
                for (j = 0; j < t.stats.length; j++) {
                    if (t.stats[j].playoffs === options.playoffs) {
                        ts.push(t.stats[j]);
                    }
                }
            }
        }

        if (ts !== undefined && ts.length >= 0) {
            ft.stats = [];
            // Multiple seasons
            for (i = 0; i < ts.length; i++) {
                ft.stats.push(filterStatsPartial({}, ts[i], options.stats));
            }
        } else {
            // Single seasons - merge stats with root object
            ft = filterStatsPartial(ft, ts, options.stats);
        }
    };

    return helpers.maybeReuseTx(["players", "releasedPlayers", "teams", "teamSeasons", "teamStats"], "readonly", options.ot, function (tx) {
        return tx.teams.getAll(options.tid).map(function (t) {
            var seasonsPromise, statsPromise;

            if (options.seasonAttrs.length === 0) {
                seasonsPromise = Promise.resolve([]);
            } else {
                if (options.season === null) {
                    seasonsPromise = tx.teamSeasons.index("tid").getAll(t.tid);
                } else {
                    seasonsPromise = tx.teamSeasons.index("season, tid").getAll([options.season, t.tid]);
                }
            }

            if (options.stats.length === 0) {
                statsPromise = Promise.resolve([]);
            } else {
                if (options.season === null) {
                    statsPromise = tx.teamStats.index("tid").getAll(t.tid);
                } else {
                    statsPromise = tx.teamStats.index("season, tid").getAll([options.season, t.tid]);
                }
            }

            return Promise.all([
                seasonsPromise,
                statsPromise
            ]).spread(function (seasons, stats) {
                t.seasons = sortBy(seasons, "season");
                t.stats = sortBy(stats, ["season", "playoffs"]);
                return t;
            });
        }).then(function (t) {
            var ft, fts, i, returnOneTeam, savePayroll, sortBy;

            // t will be an array of g.numTeams teams (if options.tid is null) or an array of 1 team. If 1, then we want to return just that team object at the end, not an array of 1 team.
            returnOneTeam = false;
            if (t.length === 1) {
                returnOneTeam = true;
            }

            fts = [];

            for (i = 0; i < t.length; i++) {
                ft = {};
                filterAttrs(ft, t[i], options);
                filterSeasonAttrs(ft, t[i], options);
                filterStats(ft, t[i], options);
                fts.push(ft);
            }

            if (Array.isArray(options.sortBy)) {
                // Sort by multiple properties
                sortBy = options.sortBy.slice();
                fts.sort(function (a, b) {
                    var result;

                    for (i = 0; i < sortBy.length; i++) {
                        result = (sortBy[i].indexOf("-") === 1) ? a[sortBy[i]] - b[sortBy[i]] : b[sortBy[i]] - a[sortBy[i]];

                        if (result || i === sortBy.length - 1) {
                            return result;
                        }
                    }
                });
            } else if (options.sortBy === "winp") {
                // Sort by winning percentage, descending
                fts.sort(function (a, b) { return b.winp - a.winp; });
            }

            // If payroll for the current season was requested, find the current payroll for each team. Otherwise, don't.
            if (options.seasonAttrs.indexOf("payroll") < 0 || options.season !== g.season) {
                return returnOneTeam ? fts[0] : fts;
            }

            savePayroll = function (i) {
                return getPayroll(options.ot, t[i].tid).get(0).then(function (payroll) {
                    fts[i].payroll = payroll / 1000;
                    if (i === fts.length - 1) {
                        return returnOneTeam ? fts[0] : fts;
                    }

                    return savePayroll(i + 1);
                });
            };
            return savePayroll(0);
        });
    });
}

// estValuesCached is either a copy of estValues (defined below) or null. When it's cached, it's much faster for repeated calls (like trading block).
function valueChange(tid, pidsAdd, pidsRemove, dpidsAdd, dpidsRemove, estValuesCached) {
    var add, getPicks, getPlayers, gpAvg, payroll, pop, remove, roster, strategy;

    // UGLY HACK: Don't include more than 2 draft picks in a trade for AI team
    if (dpidsRemove.length > 2) {
        return Promise.resolve(-1);
    }

    // Get value and skills for each player on team or involved in the proposed transaction
    roster = [];
    add = [];
    remove = [];

    return g.dbl.tx(["draftPicks", "players", "releasedPlayers", "teams", "teamSeasons", "teamStats"], function (tx) {
        // Get players
        getPlayers = function () {
            var fudgeFactor, i;

            // Fudge factor for AI overvaluing its own players
            if (tid !== g.userTid) {
                fudgeFactor = 1.05;
            } else {
                fudgeFactor = 1;
            }

            // Get roster and players to remove
            tx.players.index('tid').getAll(tid).then(function (players) {
                var i, p;

                for (i = 0; i < players.length; i++) {
                    p = players[i];

                    if (pidsRemove.indexOf(p.pid) < 0) {
                        roster.push({
                            value: p.value,
                            skills: _.last(p.ratings).skills,
                            contract: p.contract,
                            worth: player.genContract(p, false, false, true),
                            injury: p.injury,
                            age: g.season - p.born.year
                        });
                    } else {
                        remove.push({
                            value: p.value * fudgeFactor,
                            skills: _.last(p.ratings).skills,
                            contract: p.contract,
                            worth: player.genContract(p, false, false, true),
                            injury: p.injury,
                            age: g.season - p.born.year
                        });
                    }
                }
            });

            // Get players to add
            for (i = 0; i < pidsAdd.length; i++) {
                tx.players.get(pidsAdd[i]).then(function (p) {
                    add.push({
                        value: p.valueWithContract,
                        skills: _.last(p.ratings).skills,
                        contract: p.contract,
                        worth: player.genContract(p, false, false, true),
                        injury: p.injury,
                        age: g.season - p.born.year
                    });
                });
            }
        };

        getPicks = function () {
            // For each draft pick, estimate its value based on the recent performance of the team
            if (dpidsAdd.length > 0 || dpidsRemove.length > 0) {
                // Estimate the order of the picks by team
                tx.teams.getAll().then(function (teams) {
                    var estPicks, estValues, gp, halfSeason, i, rCurrent, rLast, rookieSalaries, s, sorted, t, withEstValues, wps;

                    // This part needs to be run every time so that gpAvg is available
                    wps = []; // Contains estimated winning percentages for all teams by the end of the season
                    for (i = 0; i < teams.length; i++) {
                        t = teams[i];
                        s = t.seasons.length;
                        if (t.seasons.length === 1) {
                            // First season
                            if (t.seasons[0].won + t.seasons[0].lost > 15) {
                                rCurrent = [t.seasons[0].won, t.seasons[0].lost];
                            } else {
                                // Fix for new leagues - don't base this on record until we have some games played, and don't let the user's picks be overvalued
                                if (i === g.userTid) {
                                    rCurrent = [g.numGames, 0];
                                } else {
                                    rCurrent = [0, g.numGames];
                                }
                            }
                            if (i === g.userTid) {
                                rLast = [Math.round(0.6 * g.numGames), Math.round(0.4 * g.numGames)];
                            } else {
                                rLast = [Math.round(0.4 * g.numGames), Math.round(0.6 * g.numGames)]; // Assume a losing season to minimize bad trades
                            }
                        } else {
                            // Second (or higher) season
                            rCurrent = [t.seasons[s - 1].won, t.seasons[s - 1].lost];
                            rLast = [t.seasons[s - 2].won, t.seasons[s - 2].lost];
                        }

                        gp = rCurrent[0] + rCurrent[1]; // Might not be "real" games played

                        // If we've played half a season, just use that as an estimate. Otherwise, take a weighted sum of this and last year
                        halfSeason = Math.round(0.5 * g.numGames);
                        if (gp >= halfSeason) {
                            wps.push(rCurrent[0] / gp);
                        } else if (gp > 0) {
                            wps.push((gp / halfSeason * rCurrent[0] / gp + (halfSeason - gp) / halfSeason * rLast[0] / g.numGames));
                        } else {
                            wps.push(rLast[0] / g.numGames);
                        }
                    }

                    // Get rank order of wps http://stackoverflow.com/a/14834599/786644
                    sorted = wps.slice().sort(function (a, b) { return a - b; });
                    estPicks = wps.slice().map(function (v) { return sorted.indexOf(v) + 1; }); // For each team, what is their estimated draft position?

                    rookieSalaries = require('./draft').getRookieSalaries();

                    // Actually add picks after some stuff below is done
                    withEstValues = function () {
                        var i;

                        for (i = 0; i < dpidsAdd.length; i++) {
                            tx.draftPicks.get(dpidsAdd[i]).then(function (dp) {
                                var estPick, seasons, value;

                                estPick = estPicks[dp.originalTid];

                                // For future draft picks, add some uncertainty
                                seasons = dp.season - g.season;
                                estPick = Math.round(estPick * (5 - seasons) / 5 + 15 * seasons / 5);

                                // No fudge factor, since this is coming from the user's team (or eventually, another AI)
                                if (estValues[dp.season]) {
                                    value = estValues[dp.season][estPick - 1 + g.numTeams * (dp.round - 1)];
                                }
                                if (!value) {
                                    value = estValues.default[estPick - 1 + g.numTeams * (dp.round - 1)];
                                }

                                add.push({
                                    value: value,
                                    skills: [],
                                    contract: {
                                        amount: rookieSalaries[estPick - 1 + g.numTeams * (dp.round - 1)],
                                        exp: dp.season + 2 + (2 - dp.round) // 3 for first round, 2 for second
                                    },
                                    worth: {
                                        amount: rookieSalaries[estPick - 1 + g.numTeams * (dp.round - 1)],
                                        exp: dp.season + 2 + (2 - dp.round) // 3 for first round, 2 for second
                                    },
                                    injury: {type: "Healthy", gamesRemaining: 0},
                                    age: 19,
                                    draftPick: true
                                });
                            });
                        }

                        for (i = 0; i < dpidsRemove.length; i++) {
                            tx.draftPicks.get(dpidsRemove[i]).then(function (dp) {
                                var estPick, fudgeFactor, seasons, value;

                                estPick = estPicks[dp.originalTid];

                                // For future draft picks, add some uncertainty
                                seasons = dp.season - g.season;
                                estPick = Math.round(estPick * (5 - seasons) / 5 + 15 * seasons / 5);

                                // Set fudge factor with more confidence if it's the current season
                                if (seasons === 0 && gp >= g.numGames / 2) {
                                    fudgeFactor = (1 - gp / g.numGames) * 5;
                                } else {
                                    fudgeFactor = 5;
                                }

                                // Use fudge factor: AI teams like their own picks
                                if (estValues[dp.season]) {
                                    value = estValues[dp.season][estPick - 1 + g.numTeams * (dp.round - 1)] + (tid !== g.userTid) * fudgeFactor;
                                }
                                if (!value) {
                                    value = estValues.default[estPick - 1 + g.numTeams * (dp.round - 1)] + (tid !== g.userTid) * fudgeFactor;
                                }

                                remove.push({
                                    value: value,
                                    skills: [],
                                    contract: {
                                        amount: rookieSalaries[estPick - 1 + g.numTeams * (dp.round - 1)] / 1000,
                                        exp: dp.season + 2 + (2 - dp.round) // 3 for first round, 2 for second
                                    },
                                    worth: {
                                        amount: rookieSalaries[estPick - 1 + g.numTeams * (dp.round - 1)] / 1000,
                                        exp: dp.season + 2 + (2 - dp.round) // 3 for first round, 2 for second
                                    },
                                    injury: {type: "Healthy", gamesRemaining: 0},
                                    age: 19,
                                    draftPick: true
                                });
                            });
                        }
                    };

                    if (estValuesCached) {
                        estValues = estValuesCached;
                        withEstValues();
                    } else {
                        require('./trade').getPickValues(tx).then(function (newEstValues) {
                            estValues = newEstValues;
                            withEstValues();
                        });
                    }
                });
            }
        };

        // Get team strategy and population, for future use
        filter({
            attrs: ["strategy"],
            seasonAttrs: ["pop"],
            stats: ["gp"],
            season: g.season,
            tid: tid,
            ot: tx
        }).then(function (t) {
            strategy = t.strategy;
            pop = t.pop;
            if (pop > 20) {
                pop = 20;
            }
            gpAvg = t.gp; // Ideally would be done separately for each team, but close enough

            getPlayers();
            getPicks();
        });

        getPayroll(tx, tid).then(function (payrollLocal) {
            payroll = payrollLocal;
        });
    }).then(function () {
        var base, contractsFactor, doSkillBonuses, dv, rosterAndAdd, rosterAndRemove, salaryAddedThisSeason, salaryRemoved, skillsNeeded, sumContracts, sumValues;

        gpAvg = helpers.bound(gpAvg, 0, g.numGames);

/*            // Handle situations where the team goes over the roster size limit
        if (roster.length + remove.length > 15) {
            // Already over roster limit, so don't worry unless this trade actually makes it worse
            needToDrop = (roster.length + add.length) - (roster.length + remove.length);
        } else {
            needToDrop = (roster.length + add.length) - 15;
        }
        roster.sort(function (a, b) { return a.value - b.value; }); // Sort by value, ascending
        add.sort(function (a, b) { return a.value - b.value; }); // Sort by value, ascending
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
        skillsNeeded = {
            "3": 5,
            A: 5,
            B: 3,
            Di: 2,
            Dp: 2,
            Po: 2,
            Ps: 4,
            R: 3
        };

        doSkillBonuses = function (test, roster) {
            var i, j, rosterSkills, rosterSkillsCount, s;

            // What are current skills?
            rosterSkills = [];
            for (i = 0; i < roster.length; i++) {
                if (roster[i].value >= 45) {
                    rosterSkills.push(roster[i].skills);
                }
            }
            rosterSkills = _.flatten(rosterSkills);
            rosterSkillsCount = _.countBy(rosterSkills);

            // Sort test by value, so that the highest value players get bonuses applied first
            test.sort(function (a, b) { return b.value - a.value; });

            for (i = 0; i < test.length; i++) {
                if (test.value >= 45) {
                    for (j = 0; j < test[i].skills.length; j++) {
                        s = test[i].skills[j];

                        if (rosterSkillsCount[s] <= skillsNeeded[s] - 2) {
                            // Big bonus
                            test.value *= 1.1;
                        } else if (rosterSkillsCount[s] <= skillsNeeded[s] - 1) {
                            // Medium bonus
                            test.value *= 1.05;
                        } else if (rosterSkillsCount[s] <= skillsNeeded[s]) {
                            // Little bonus
                            test.value *= 1.025;
                        }

                        // Account for redundancy in test
                        rosterSkillsCount[s] += 1;
                    }
                }
            }

            return test;
        };

        // Apply bonuses based on skills coming in and leaving
        rosterAndRemove = roster.concat(remove);
        rosterAndAdd = roster.concat(add);
        add = doSkillBonuses(add, rosterAndRemove);
        remove = doSkillBonuses(remove, rosterAndAdd);

        // This actually doesn't do anything because I'm an idiot
        base = 1.25;

        sumValues = function (players, includeInjuries) {
            var exponential;

            includeInjuries = includeInjuries !== undefined ? includeInjuries : false;

            if (players.length === 0) {
                return 0;
            }

            exponential = _.reduce(players, function (memo, p) {
                var contractSeasonsRemaining, contractValue, playerValue, value;

                playerValue = p.value;

                if (strategy === "rebuilding") {
                    // Value young/cheap players and draft picks more. Penalize expensive/old players
                    if (p.draftPick) {
                        playerValue *= 1.15;
                    } else {
                        if (p.age <= 19) {
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

                contractValue = (p.worth.amount - p.contract.amount) / 1000;

                // Account for duration
                contractSeasonsRemaining = player.contractSeasonsRemaining(p.contract.exp, g.numGames - gpAvg);
                if (contractSeasonsRemaining > 1) {
                    // Don't make it too extreme
                    contractValue *= Math.pow(contractSeasonsRemaining, 0.25);
                } else {
                    // Raising < 1 to < 1 power would make this too large
                    contractValue *= contractSeasonsRemaining;
                }

                // Really bad players will just get no PT
                if (playerValue < 0) {
                    playerValue = 0;
                }
//console.log([playerValue, contractValue]);

                value = playerValue + 0.5 * contractValue;

                if (value === 0) {
                    return memo;
                }
                return memo + Math.pow(Math.abs(value), base) * Math.abs(value) / value;
            }, 0);

            if (exponential === 0) {
                return exponential;
            }
            return Math.pow(Math.abs(exponential), 1 / base) * Math.abs(exponential) / exponential;
        };

        // Sum of contracts
        // If onlyThisSeason is set, then amounts after this season are ignored and the return value is the sum of this season's contract amounts in millions of dollars
        sumContracts = function (players, onlyThisSeason) {
            var sum;

            onlyThisSeason = onlyThisSeason !== undefined ? onlyThisSeason : false;

            if (players.length === 0) {
                return 0;
            }

            sum = _.reduce(players, function (memo, p) {
                if (p.draftPick) {
                    return memo;
                }

                return memo + p.contract.amount / 1000 * Math.pow(player.contractSeasonsRemaining(p.contract.exp, g.numGames - gpAvg), 0.25 - (onlyThisSeason ? 0.25 : 0));
            }, 0);

            return sum;
        };

        if (strategy === "rebuilding") {
            contractsFactor = 0.3;
        } else {
            contractsFactor = 0.1;
        }

        salaryRemoved = sumContracts(remove) - sumContracts(add);

        dv = sumValues(add, true) - sumValues(remove) + contractsFactor * salaryRemoved;
/*console.log("Added players/picks: " + sumValues(add, true));
console.log("Removed players/picks: " + (-sumValues(remove)));
console.log("Added contract quality: -" + contractExcessFactor + " * " + sumContractExcess(add));
console.log("Removed contract quality: -" + contractExcessFactor + " * " + sumContractExcess(remove));
console.log("Total contract amount: " + contractsFactor + " * " + salaryRemoved);*/

        // Aversion towards losing cap space in a trade during free agency
        if (g.phase >= g.PHASE.RESIGN_PLAYERS || g.phase <= g.PHASE.FREE_AGENCY) {
            // Only care if cap space is over 2 million
            if (payroll + 2000 < g.salaryCap) {
                salaryAddedThisSeason = sumContracts(add, true) - sumContracts(remove, true);
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
    });
}

/**
 * Update team strategies (contending or rebuilding) for every team in the league.
 *
 * Basically.. switch to rebuilding if you're old and your success is fading, and switch to contending if you have a good amount of young talent on rookie deals and your success is growing.
 *
 * @memberOf core.team
 * @param {IDBTransaction} tx An IndexedDB transaction on players, playerStats, and teams, readwrite.
 * @return {Promise}
 */
function updateStrategies(tx) {
    return tx.teams.iterate(function (t) {
        var dWon, won;

        // Skip user's team
        if (t.tid === g.userTid) {
            return;
        }

        // Change in wins
        return Promise.all([
            tx.teamSeasons.index("season, tid").get([g.season, t.tid]),
            tx.teamSeasons.index("season, tid").get([g.season - 1, t.tid])
        ]).spread(function (teamSeason, teamSeasonOld) {
            won = teamSeason.won;
            if (teamSeasonOld) {
                dWon = won - teamSeasonOld.won;
            } else {
                dWon = 0;
            }
        }).then(function () {
            // Young stars
            return tx.players.index('tid').getAll(t.tid).then(function (players) {
                return player.withStats(tx, players, {
                    statsSeasons: [g.season],
                    statsTid: t.tid
                });
            });
        }).then(function (players) {
            var age, denominator, i, numerator, score, updated, youngStar;

            players = player.filter(players, {
                season: g.season,
                tid: t.tid,
                attrs: ["age", "value", "contract"],
                stats: ["min"]
            });

            youngStar = 0; // Default value

            numerator = 0; // Sum of age * mp
            denominator = 0; // Sum of mp
            for (i = 0; i < players.length; i++) {
                numerator += players[i].age * players[i].stats.min;
                denominator += players[i].stats.min;

                // Is a young star about to get a pay raise and eat up all the cap after this season?
                if (players[i].value > 65 && players[i].contract.exp === g.season + 1 && players[i].contract.amount <= 5 && players[i].age <= 25) {
                    youngStar += 1;
                }
            }

            // Average age, weighted by minutes played
            age = numerator / denominator;

            score = 0.8 * dWon + (won - g.numGames / 2) + 5 * (26 - age) + youngStar * 20;

            updated = false;
            if (score > 20 && t.strategy === "rebuilding") {
                t.strategy = "contending";
                updated = true;
            } else if (score < -20 && t.strategy === "contending") {
                t.strategy = "rebuilding";
                updated = true;
            }

            if (updated) {
                return t;
            }
        });
    });
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
function checkRosterSizes() {
    return g.dbl.tx(["players", "playerStats", "releasedPlayers", "teams"], "readwrite", function (tx) {
        var checkRosterSize, minFreeAgents, userTeamSizeError;

        checkRosterSize = function (tid) {
            return tx.players.index('tid').getAll(tid).then(function (players) {
                var i, numPlayersOnRoster, p, promises;

                numPlayersOnRoster = players.length;
                if (numPlayersOnRoster > 15) {
                    if (g.userTids.indexOf(tid) >= 0 && g.autoPlaySeasons === 0) {
                        if (g.userTids.length <= 1) {
                            userTeamSizeError = 'Your team has ';
                        } else {
                            userTeamSizeError = 'The ' + g.teamRegionsCache[tid] + ' ' + g.teamNamesCache[tid] + ' have ';
                        }
                        userTeamSizeError += 'more than the maximum number of players (15). You must remove players (by <a href="' + helpers.leagueUrl(["roster"]) + '">releasing them from your roster</a> or through <a href="' + helpers.leagueUrl(["trade"]) + '">trades</a>) before continuing.';
                    } else {
                        // Automatically drop lowest value players until we reach 15
                        players.sort(function (a, b) { return a.value - b.value; }); // Lowest first
                        promises = [];
                        for (i = 0; i < (numPlayersOnRoster - 15); i++) {
                            promises.push(player.release(tx, players[i], false));
                        }
                        return Promise.all(promises);
                    }
                } else if (numPlayersOnRoster < g.minRosterSize) {
                    if (g.userTids.indexOf(tid) >= 0 && g.autoPlaySeasons === 0) {
                        if (g.userTids.length <= 1) {
                            userTeamSizeError = 'Your team has ';
                        } else {
                            userTeamSizeError = 'The ' + g.teamRegionsCache[tid] + ' ' + g.teamNamesCache[tid] + ' have ';
                        }
                        userTeamSizeError += 'less than the minimum number of players (' + g.minRosterSize + '). You must add players (through <a href="' + helpers.leagueUrl(["free_agents"]) + '">free agency</a> or <a href="' + helpers.leagueUrl(["trade"]) + '">trades</a>) before continuing.<br><br>Reminder: you can always sign free agents to ' + helpers.formatCurrency(g.minContract / 1000, "M", 1) + '/yr contracts, even if you\'re over the cap!';
                    } else {
                        // Auto-add players
                        promises = [];
                        while (numPlayersOnRoster < g.minRosterSize) {
                            // See also core.phase
                            p = minFreeAgents.shift();
                            p.tid = tid;
                            p = player.addStatsRow(tx, p, g.phase === g.PHASE.PLAYOFFS);
                            p = player.setContract(p, p.contract, true);
                            p.gamesUntilTradable = 15;

                            eventLog.add(null, {
                                type: "freeAgent",
                                text: 'The <a href="' + helpers.leagueUrl(["roster", g.teamAbbrevsCache[p.tid], g.season]) + '">' + g.teamNamesCache[p.tid] + '</a> signed <a href="' + helpers.leagueUrl(["player", p.pid]) + '">' + p.name + '</a> for ' + helpers.formatCurrency(p.contract.amount / 1000, "M") + '/year through ' + p.contract.exp + '.',
                                showNotification: false,
                                pids: [p.pid],
                                tids: [p.tid]
                            });

                            promises.push(tx.players.put(p));

                            numPlayersOnRoster += 1;
                        }
                        return Promise.all(promises);
                    }
                }
            }).then(function () {
                // Auto sort rosters (except player's team)
                // This will sort all AI rosters before every game. Excessive? It could change some times, but usually it won't
                if (g.userTids.indexOf(tid) < 0 || g.autoPlaySeasons > 0) {
                    return rosterAutoSort(tx, tid);
                }
            });
        };

        userTeamSizeError = null;

        return tx.players.index('tid').getAll(g.PLAYER.FREE_AGENT).then(function (players) {
            var i, promises;

            // List of free agents looking for minimum contracts, sorted by value. This is used to bump teams up to the minimum roster size.
            minFreeAgents = [];
            for (i = 0; i < players.length; i++) {
                if (players[i].contract.amount === g.minContract) {
                    minFreeAgents.push(players[i]);
                }
            }
            minFreeAgents.sort(function (a, b) { return b.value - a.value; });

            // Make sure teams are all within the roster limits
            promises = [];
            for (i = 0; i < g.numTeams; i++) {
                promises.push(checkRosterSize(i));
            }
            return Promise.all(promises);
        }).then(function () {
            return userTeamSizeError;
        });
    });
}

module.exports = {
    genSeasonRow: genSeasonRow,
    genStatsRow: genStatsRow,
    generate: generate,
    findStarters: findStarters,
    rosterAutoSort: rosterAutoSort,
    filter: filter,
    valueChange: valueChange,
    updateStrategies: updateStrategies,
    checkRosterSizes: checkRosterSizes,
    getPayroll: getPayroll,
    getPayrolls: getPayrolls
};

