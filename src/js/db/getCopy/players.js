import backboard from 'backboard';
import orderBy from 'lodash.orderby';
import _ from 'underscore';
import g from '../../globals';
import {mergeByPk} from './helpers';
import {contractSeasonsRemaining, fuzzRating} from '../../core/player';
import * as helpers from '../../util/helpers';
import type {BackboardTx, Player, PlayerFiltered} from '../../util/types';

type PlayerAttr = string;
type PlayerRatingAttr = string;
type PlayerStatAttr = string;
type StatType = 'per36' | 'perGame' | 'totals';

type PlayerOptions = {
    season?: number,
    tid?: number,
    attrs: PlayerAttr[],
    ratings: PlayerStatAttr[],
    stats: PlayerRatingAttr[],
    playoffs: boolean,
    regularSeason: boolean,
    showNoStats: boolean,
    showRookies: boolean,
    showRetired: boolean,
    fuzz: boolean,
    oldStats: boolean,
    numGamesRemaining: number,
    statType: StatType,
};

const processAttrs = (output: PlayerFiltered, p: Player, {
    attrs,
    fuzz,
    numGamesRemaining,
    season,
}: PlayerOptions) => {
    for (const attr of attrs) {
        if (attr === 'age') {
            output.age = g.season - p.born.year;
        } else if (attr === 'diedYear') {
            // Non-dead players wil not have any diedYear property
            output.diedYear = p.hasOwnProperty('diedYear') ? p.diedYear : null;
        } else if (attr === 'draft') {
            output.draft = Object.assign({}, p.draft, {age: p.draft.year - p.born.year});
            if (fuzz) {
                output.draft.ovr = fuzzRating(output.draft.ovr, p.ratings[0].fuzz);
                output.draft.pot = fuzzRating(output.draft.pot, p.ratings[0].fuzz);
            }
            // Inject abbrevs
            output.draft.abbrev = g.teamAbbrevsCache[output.draft.tid];
            output.draft.originalAbbrev = g.teamAbbrevsCache[output.draft.originalTid];
        } else if (attr === 'hgtFt') {
            output.hgtFt = Math.floor(p.hgt / 12);
        } else if (attr === 'hgtIn') {
            output.hgtIn = p.hgt - 12 * Math.floor(p.hgt / 12);
        } else if (attr === 'contract') {
            output.contract = helpers.deepCopy(p.contract);  // [millions of dollars]
            output.contract.amount /= 1000;  // [millions of dollars]
        } else if (attr === 'cashOwed') {
            output.cashOwed = contractSeasonsRemaining(p.contract.exp, numGamesRemaining) * p.contract.amount / 1000;  // [millions of dollars]
        } else if (attr === 'abbrev') {
            output.abbrev = helpers.getAbbrev(p.tid);
        } else if (attr === 'teamRegion') {
            if (p.tid >= 0) {
                output.teamRegion = g.teamRegionsCache[p.tid];
            } else {
                output.teamRegion = '';
            }
        } else if (attr === 'teamName') {
            if (p.tid >= 0) {
                output.teamName = g.teamNamesCache[p.tid];
            } else if (p.tid === g.PLAYER.FREE_AGENT) {
                output.teamName = 'Free Agent';
            } else if (p.tid === g.PLAYER.UNDRAFTED || p.tid === g.PLAYER.UNDRAFTED_2 || p.tid === g.PLAYER.UNDRAFTED_3 || p.tid === g.PLAYER.UNDRAFTED_FANTASY_TEMP) {
                output.teamName = 'Draft Prospect';
            } else if (p.tid === g.PLAYER.RETIRED) {
                output.teamName = 'Retired';
            }
        } else if (attr === 'injury' && season !== undefined && season < g.season) {
            output.injury = {type: 'Healthy', gamesRemaining: 0};
        } else if (attr === 'salaries') {
            output.salaries = _.map(p.salaries, salary => { salary.amount /= 1000; return salary; });
        } else if (attr === 'salariesTotal') {
            output.salariesTotal = _.reduce(output.salaries, (memo, salary) => memo + salary.amount, 0);
        } else if (attr === 'awardsGrouped') {
            output.awardsGrouped = [];
            const awardsGroupedTemp = _.groupBy(p.awards, award => award.type);
            for (const award of Object.keys(awardsGroupedTemp)) {
                output.awardsGrouped.push({
                    type: award,
                    count: awardsGroupedTemp[award].length,
                    seasons: helpers.yearRanges(_.pluck(awardsGroupedTemp[award], 'season')),
                });
            }
        } else if (attr === 'name') {
            output.name = `${p.firstName} ${p.lastName}`;
        } else {
            // Several other attrs are not primitive types, so deepCopy
            output[attr] = helpers.deepCopy(p[attr]);
        }
    }
};

const processRatings = async (output: PlayerFiltered, p: Player, {
    fuzz,
    ratings,
    season,
}: PlayerOptions) => {
    output.ratings = p.ratings.filter((pr) => {
        if (season !== undefined) {
            return pr.season === season;
        }
        return true;
    }).map((pr, i) => {
        const row = {};

        for (const attr of ratings) {
            if (attr === 'skills') {
                row.skills = helpers.deepCopy(pr.skills);
            } else if (attr === 'dovr' || attr === 'dpot') {
                // Handle dovr and dpot - if there are previous ratings, calculate the fuzzed difference
                const cat = attr.slice(1); // either ovr or pot
                if (i > 0) {
                    row[attr] = fuzzRating(pr[cat], pr.fuzz) - fuzzRating(p.ratings[i - 1][cat], p.ratings[i - 1].fuzz);
                } else {
                    row[attr] = 0;
                }
            } else if (fuzz && attr !== 'fuzz' && attr !== 'season' && attr !== 'hgt' && attr !== 'pos') {
                row[attr] = fuzzRating(row[attr], pr.fuzz);
            } else {
                row[attr] = pr[attr];
            }
        }

/*if (pr === null) {
    // Must be retired, or not in the league yet
    if (options.showRetired && p.tid === g.PLAYER.RETIRED) {
        // If forcing to show retired players, blank it out
        row = {};
        for (let k = 0; k < ratings.length; k++) {
            if (attr === 'skills') {
                row[attr] = [];
            } else {
                row[attr] = 0;
            }
        }
        return true;
    } else if (options.showRetired && (p.tid === g.PLAYER.UNDRAFTED || p.tid === g.PLAYER.UNDRAFTED_2 || p.tid === g.PLAYER.UNDRAFTED_3)) {
        // What not show draft prospects too? Just for fun.
        pr = p.ratings[0]; // Only has one entry
    } else {
        return false;
    }
}

// All seasons
row = [];
for (let k = 0; k < p.ratings.length; k++) {
    // If a specific tid was requested, only return ratings if a stat was accumulated for that tid
    if (options.tid !== null) {
        let hasStats = false;
        for (let j = 0; j < p.stats.length; j++) {
            if (options.tid === p.stats[j].tid && p.attr.season === p.stats[j].season) {
                hasStats = true;
                break;
            }
        }
        if (!hasStats) {
            continue;
        }
    }

    const kk = row.length; // Not always the same as k, due to hasStats filtering above
    row[kk] = {};
    for (let j = 0; j < ratings.length; j++) {
        if (ratings[j] === 'age') {
            row[kk].age = p.attr.season - p.born.year;
        } else if (ratings[j] === 'abbrev') {
            // Find the last stats entry for that season, and use that to determine the team
            let tidTemp;
            for (let i = 0; i < p.stats.length; i++) {
                if (p.stats[i].season === p.attr.season && p.stats[i].playoffs === false) {
                    tidTemp = p.stats[i].tid;
                }
            }
            if (tidTemp !== undefined) {
                row[kk].abbrev = helpers.getAbbrev(tidTemp);
            } else {
                row[kk].abbrev = null;
            }
        } else {
            row[kk][ratings[j]] = p.attr[ratings[j]];
            if (options.fuzz && ratings[j] !== 'fuzz' && ratings[j] !== 'season' && ratings[j] !== 'skills' && ratings[j] !== 'hgt' && ratings[j] !== 'pos') {
                row[kk][ratings[j]] = fuzzRating(p.attr[ratings[j]], p.attr.fuzz);
            }
        }
    }
}*/

        return row;
    });

    if (season !== undefined) {
        output.ratings = output.ratings[0];
    }
};

const processStats = async (output: PlayerFiltered, p: Player, {
    attrs,
    fuzz,
    numGamesRemaining,
    playoffs,
    regularSeason,
    season,
}: PlayerOptions, tx: ?BackboardTx) => {
    if (season !== undefined && ((playoffs && !regularSeason) || (!playoffs && regularSeason))) {
        output.stats = output.stats[0];
    }
};

const processPlayer = async (p: Player, options: PlayerOptions, tx: ?BackboardTx) => {
    const output = {};

    if (options.attrs.length > 0) {
        processAttrs(output, p, options);
    }

    if (options.stats.length > 0) {
        await processStats(output, p, options, tx);
    }

    if (options.ratings.length > 0) {
        processRatings(output, p, options);
    }

    return output;
};

const getCopy = async (players: Player | Player[], {
    season,
    tid,
    attrs = [],
    ratings = [],
    stats = [],
    playoffs = false,
    regularSeason = true,
    showNoStats = false,
    showRookies = false,
    showRetired = false,
    fuzz = false,
    oldStats = false,
    numGamesRemaining = 0,
    statType = 'perGame',
}: PlayerOptions = {}): Promise<PlayerFiltered | PlayerFiltered[]> => {
    const options = {
        season,
        tid,
        attrs,
        ratings,
        stats,
        playoffs,
        regularSeason,
        showNoStats,
        showRookies,
        showRetired,
        fuzz,
        oldStats,
        numGamesRemaining,
        statType,
    };

    // Does this require IDB?
    const objectStores = [];
    const useCache = season === g.season && ((regularSeason && !playoffs && g.phase < g.PHASE.PLAYOFFS) || (!regularSeason && playoffs && g.phase >= g.PHASE.PLAYOFFS));
    if (stats.length > 0 && !useCache) {
        objectStores.push('playerStats');
    }

    const processMaybeWithIDB = async (tx: ?BackboardTx) => {
        if (Array.isArray(players)) {
            return Promise.all(players.map((p) => processPlayer(p, options, tx)));
        }

        return processPlayer(players, options, tx);
    };

    if (objectStores.length > 0) {
        return g.dbl.tx(objectStores, (tx) => processMaybeWithIDB(tx));
    }
    return processMaybeWithIDB();
};

export default getCopy;
