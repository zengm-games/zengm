import backboard from 'backboard';
import _ from 'underscore';
import g from '../../globals';
import {filterOrderStats, mergeByPk} from './helpers';
import * as team from '../../core/team';
import * as helpers from '../../util/helpers';
import type {BackboardTx, Team, TeamFiltered} from '../../util/types';

type TeamAttr = string;
type TeamSeasonAttr = string;
type TeamStatAttr = string;
type StatType = 'perGame' | 'totals';

type TeamOptions = {
    season?: number,
    attrs: TeamAttr[],
    seasonAttrs: TeamSeasonAttr[],
    stats: TeamStatAttr[],
    playoffs: boolean,
    regularSeason: boolean,
    statType: StatType,
};

const processAttrs = (output: TeamFiltered, t: Team, attrs: TeamAttr[]) => {
    for (const attr of attrs) {
        if (attr === 'budget') {
            output.budget = helpers.deepCopy(t.budget);
            for (const [key, value] of Object.entries(output.budget)) {
                if (key !== 'ticketPrice') { // ticketPrice is the only thing in dollars always
                    value.amount /= 1000;
                }
            }
        } else {
            output[attr] = t[attr];
        }
    }
};

const processSeasonAttrs = async (output: TeamFiltered, t: Team, seasonAttrs: TeamSeasonAttr[], season: ?number, tx: ?BackboardTx) => {
    let seasons;
    if (season === undefined) {
        // All seasons
        seasons = mergeByPk(
            await tx.teamSeasons.index('tid, season').getAll(backboard.bound([t.tid], [t.tid, ''])),
            await g.cache.indexGetAll('teamSeasonsByTidSeason', [`${t.tid}`, `${t.tid + 1}`]),
            g.cache.storeInfos.teamSeasons.pk,
        );
    } else if (season >= g.season - 2) {
        // Single season, from cache
        seasons = await g.cache.indexGetAll('teamSeasonsBySeasonTid', `${season},${t.tid}`);
    } else {
        // Single season, from database
        seasons = await tx.teamSeasons.index('season, tid').getAll([season, t.tid]);
    }

    output.seasonAttrs = await Promise.all(seasons.map(async (ts) => {
        const row = {};

        // Revenue and expenses calculation
        const revenue = _.reduce(helpers.deepCopy(ts.revenues), (memo, rev) => memo + rev.amount, 0);
        const expense = _.reduce(helpers.deepCopy(ts.expenses), (memo, exp) => memo + exp.amount, 0);

        for (const attr of seasonAttrs) {
            if (attr === 'winp') {
                row.winp = 0;
                if (ts.won + ts.lost > 0) {
                    row.winp = ts.won / (ts.won + ts.lost);
                }
            } else if (attr === 'att') {
                row.att = 0;
                if (!ts.hasOwnProperty('gpHome')) { ts.gpHome = Math.round(ts.gp / 2); } // See also game.js and teamFinances.js
                if (ts.gpHome > 0) {
                    row.att = ts.att / ts.gpHome;
                }
            } else if (attr === 'cash') {
                row.cash = ts.cash / 1000; // [millions of dollars]
            } else if (attr === 'revenue') {
                row.revenue = revenue / 1000; // [millions of dollars]
            } else if (attr === 'profit') {
                row.profit = (revenue - expense) / 1000; // [millions of dollars]
            } else if (attr === 'salaryPaid') {
                row.salaryPaid = ts.expenses.salary.amount / 1000; // [millions of dollars]
            } else if (attr === 'payroll') {
                if (season === g.season) {
                    row.payroll = (await team.getPayroll(t.tid).get(0)) / 1000;
                } else {
                    row.payroll = undefined;
                }
            } else if (attr === 'lastTen') {
                const lastTenWon = ts.lastTen.reduce((memo, num) => memo + num, 0);
                const lastTenLost = ts.lastTen.length - lastTenWon;
                row.lastTen = `${lastTenWon}-${lastTenLost}`;
            } else if (attr === 'streak') {  // For standings
                if (ts.streak === 0) {
                    row.streak = 'None';
                } else if (ts.streak > 0) {
                    row.streak = `Won ${ts.streak}`;
                } else if (ts.streak < 0) {
                    row.streak = `Lost ${Math.abs(ts.streak)}`;
                }
            } else {
                row[attr] = ts[attr];
            }
        }

        return row;
    }));

    if (season !== undefined) {
        output.seasonAttrs = output.seasonAttrs[0];
    }
};

const processStats = async (
    output: TeamFiltered,
    t: Team,
    stats: TeamStatAttr[],
    playoffs: boolean,
    regularSeason: boolean,
    statType: StatType,
    season: ?number,
    tx: ?BackboardTx,
) => {
    let teamStats;

    const teamStatsFromCache = async () => {
        // Single season, from cache
        let teamStats2 = [];
        if (regularSeason) {
            teamStats2 = teamStats2.concat(await g.cache.indexGetAll('teamStatsByPlayoffsTid', `0,${t.tid}`));
        }
        if (playoffs) {
            teamStats2 = teamStats2.concat(await g.cache.indexGetAll('teamStatsByPlayoffsTid', `1,${t.tid}`));
        }

        return teamStats2;
    };

    if (season === undefined) {
        // All seasons
        teamStats = mergeByPk(
            await tx.teamStats.index('tid').getAll(t.tid),
            await teamStatsFromCache(),
            g.cache.storeInfos.teamStats.pk,
        );
    } else if (season === g.season) {
        teamStats = await teamStatsFromCache();
    } else {
        // Single season, from database
        teamStats = await tx.teamStats.index('season, tid').getAll([season, t.tid]);
    }

    // Handle playoffs/regularSeason
    teamStats = filterOrderStats(teamStats, playoffs, regularSeason);

    if (teamStats.length === 0) {
        teamStats.push({});
    }

    output.stats = teamStats.map((ts) => {
        const row = {};

        if (ts.gp > 0) {
            for (const stat of stats) {
                if (stat === 'gp') {
                    row.gp = ts.gp;
                } else if (stat === 'fgp') {
                    if (ts.fga > 0) {
                        row.fgp = 100 * ts.fg / ts.fga;
                    } else {
                        row.fgp = 0;
                    }
                } else if (stat === 'fgpAtRim') {
                    if (ts.fgaAtRim > 0) {
                        row.fgpAtRim = 100 * ts.fgAtRim / ts.fgaAtRim;
                    } else {
                        row.fgpAtRim = 0;
                    }
                } else if (stat === 'fgpLowPost') {
                    if (ts.fgaLowPost > 0) {
                        row.fgpLowPost = 100 * ts.fgLowPost / ts.fgaLowPost;
                    } else {
                        row.fgpLowPost = 0;
                    }
                } else if (stat === 'fgpMidRange') {
                    if (ts.fgaMidRange > 0) {
                        row.fgpMidRange = 100 * ts.fgMidRange / ts.fgaMidRange;
                    } else {
                        row.fgpMidRange = 0;
                    }
                } else if (stat === 'tpp') {
                    if (ts.tpa > 0) {
                        row.tpp = 100 * ts.tp / ts.tpa;
                    } else {
                        row.tpp = 0;
                    }
                } else if (stat === 'ftp') {
                    if (ts.fta > 0) {
                        row.ftp = 100 * ts.ft / ts.fta;
                    } else {
                        row.ftp = 0;
                    }
                } else if (stat === 'diff') {
                    if (statType === 'totals') {
                        row.diff = ts.pts - ts.oppPts;
                    } else {
                        row.diff = (ts.pts - ts.oppPts) / ts.gp;
                    }
                } else if (stat === 'season' || stat === 'playoffs') {
                    row[stat] = ts[stat];
                } else if (statType === 'totals') {
                    row[stat] = ts[stat];
                } else {
                    row[stat] = ts[stat] / ts.gp;
                }
            }
        } else {
            for (const stat of stats) {
                if (stat === 'season' || stat === 'playoffs') {
                    row[stat] = ts[stat];
                } else {
                    row[stat] = 0;
                }
            }
        }

        // Since they come in same stream, always need to be able to distinguish
        row.playoffs = ts.playoffs !== undefined ? ts.playoffs : playoffs;

        return row;
    });

    if (season !== undefined && ((playoffs && !regularSeason) || (!playoffs && regularSeason))) {
        output.stats = output.stats[0];
    }
};

const processTeam = async (t: Team, {
    season,
    attrs,
    seasonAttrs,
    stats,
    playoffs,
    regularSeason,
    statType,
}: TeamOptions, tx: ?BackboardTx) => {
    const output = {};

    if (attrs.length > 0) {
        processAttrs(output, t, attrs);
    }

    const promises = [];

    if (seasonAttrs.length > 0) {
        promises.push(processSeasonAttrs(output, t, seasonAttrs, season, tx));
    }

    if (stats.length > 0) {
        promises.push(processStats(output, t, stats, playoffs, regularSeason, statType, season, tx));
    }

    await Promise.all(promises);

    return output;
};
/**
 * Retrieve a filtered copy of a team object, or an array of all team objects.
 *
 * This can be used to retrieve information about a certain season, compute average statistics from the raw data, etc.
 *
 * If you request just one season (so, explicitly set season and then only one of playoffs and regularSeason is true), then stats and seasonAttrs will be returned as an object. Otherwise, they will be arrays of objects.
 *
 * @memberOf core.team
 * @param {Object} options Options, as described below.
 * @param {number=} options.tid Team ID. Set this if you want to return only one team object. If undefined, an array of all teams is returned, ordered by tid.
 * @param {number=} options.season Season to retrieve stats/seasonAttrs for. If undefined, all seasons will be returned.
 * @param {Array.<string>=} options.attrs List of team attributes to include in output (e.g. region, abbrev, name, ...).
 * @param {Array.<string>=} options.seasonAttrs List of seasonal team attributes to include in output (e.g. won, lost, payroll, ...).
 * @param {Array.<string=>} options.stats List of team stats to include in output (e.g. fg, orb, ast, blk, ...).
 * @param {boolean=} options.playoffs Boolean representing whether to return playoff stats or not; default is false.
 * @param {boolean=} options.regularSeason Boolean representing whether to return playoff stats or not; default is false.
 * @param {string=} options.statType: What type of stats to return, 'perGame' or 'totals' (default is 'perGame).
 * @return {Promise.(Object|Array.<Object>)} Filtered team object or array of filtered team objects, depending on the inputs.
 */
const getCopy = async ({
    tid,
    season,
    attrs = [],
    seasonAttrs = [],
    stats = [],
    playoffs = false,
    regularSeason = true,
    statType = 'perGame',
}: TeamOptions & {tid?: number} = {}): Promise<TeamFiltered | TeamFiltered[]> => {
    const options = {
        season,
        attrs,
        seasonAttrs,
        stats,
        playoffs,
        regularSeason,
        statType,
    };

    // Does this require IDB?
    const objectStores = [];
    if (seasonAttrs.length > 0 && (season === undefined || season < g.season - 2)) {
        objectStores.push('teamSeasons');
    }
    if (stats.length > 0 && season !== g.season) {
        objectStores.push('teamStats');
    }

    const processMaybeWithIDB = async (tx: ?BackboardTx) => {
        if (tid === undefined) {
            const teams = await g.cache.getAll('teams');
            return Promise.all(teams.map((t) => processTeam(t, options, tx)));
        }

        const t = await g.cache.get('teams', tid);
        return processTeam(t, options, tx);
    };

    if (objectStores.length > 0) {
        return g.dbl.tx(objectStores, (tx) => processMaybeWithIDB(tx));
    }
    return processMaybeWithIDB();
};

export default getCopy;
