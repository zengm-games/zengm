// @flow

import React from 'react';
import g from '../globals';
import logEvent from './logEvent';
import type {BackboardTx, GameProcessed, GameProcessedCompleted, Pick, TeamBasic} from './types';

/**
 * Validate that a given abbreviation corresponds to a team.
 *
 * If the abbreviation is not valid, then g.userTid and its correspodning abbreviation will be returned.
 *
 * @memberOf util.helpers
 * @param  {string} abbrev Three-letter team abbreviation, like "ATL".
 * @return {Array} Array with two elements, the team ID and the validated abbreviation.
 */
function validateAbbrev(abbrev: string): [number, string] {
    let tid = g.teamAbbrevsCache.indexOf(abbrev);

    if (tid < 0) {
        tid = g.userTid;
        abbrev = g.teamAbbrevsCache[tid];
    }

    return [tid, abbrev];
}

/**
 * Validate that a given team ID corresponds to a team.
 *
 * If the team ID is not valid, then g.userTid and its correspodning abbreviation will be returned.
 *
 * @memberOf util.helpers
 * @param {number|string} tid Integer team ID.
 * @return {Array} Array with two elements, the validated team ID and the corresponding abbreviation.
 */
function validateTid(tid: number | string): [number, string] {
    tid = parseInt(tid, 10);

    if (tid < 0 || tid >= g.teamAbbrevsCache.length || isNaN(tid)) {
        tid = g.userTid;
    }
    const abbrev = g.teamAbbrevsCache[tid];

    return [tid, abbrev];
}

/**
 * Get the team abbreviation for a team ID.
 *
 * For instance, team ID 0 is Atlanta, which has an abbreviation of ATL. This is a convenience wrapper around validateTid, excpet it will return "FA" if you pass g.PLAYER.FREE_AGENT.
 *
 * @memberOf util.helpers
 * @param {number|string} tid Integer team ID.
 * @return {string} Abbreviation
 */
function getAbbrev(tid: number | string): string {
    tid = parseInt(tid, 10);

    if (tid === g.PLAYER.FREE_AGENT) {
        return "FA";
    }
    if (tid < 0 || isNaN(tid)) {
        // Draft prospect or retired
        return "";
    }
    const result = validateTid(tid);
    const abbrev = result[1];

    return abbrev;
}

/**
 * Validate the given season.
 *
 * Currently this doesn't really do anything except replace "undefined" with g.season.
 *
 * @memberOf util.helpers
 * @param {number|string|undefined} season The year of the season to validate. If undefined, then g.season is used.
 * @return {number} Validated season (same as input unless input is undefined, currently).
 */
function validateSeason(season?: number | string): number {
    if (season === undefined) {
        return g.season;
    }

    season = parseInt(season, 10);

    if (isNaN(season)) {
        return g.season;
    }

    return season;
}

/**
 * Take a list of teams (similar to the output of getTeamsDefault) and add popRank properties, where 1 is the largest population and teams.length is the smallest.
 *
 * @param {Array.<Object>} teams Teams without popRank properties.
 * @return {Array.<Object>} Teams with added popRank properties.
 */
function addPopRank(teams: TeamBasic[]): TeamBasic[] {
    // Add popRank
    const teamsSorted = teams.slice(); // Deep copy
    teamsSorted.sort((a, b) => b.pop - a.pop);
    for (let i = 0; i < teams.length; i++) {
        for (let j = 0; j < teamsSorted.length; j++) {
            if (teams[i].tid === teamsSorted[j].tid) {
                teams[i].popRank = j + 1;
                break;
            }
        }
    }

    return teams;
}

function getTeamsDefault(): TeamBasic[] {
    let teams = [
        {tid: 0, cid: 0, did: 2, region: "Atlanta", name: "Gold Club", abbrev: "ATL", pop: 4.3},
        {tid: 1, cid: 0, did: 2, region: "Baltimore", name: "Crabs", abbrev: "BAL", pop: 2.2},
        {tid: 2, cid: 0, did: 0, region: "Boston", name: "Massacre", abbrev: "BOS", pop: 4.4},
        {tid: 3, cid: 0, did: 1, region: "Chicago", name: "Whirlwinds", abbrev: "CHI", pop: 8.8},
        {tid: 4, cid: 0, did: 1, region: "Cincinnati", name: "Riots", abbrev: "CIN", pop: 1.6},
        {tid: 5, cid: 0, did: 1, region: "Cleveland", name: "Curses", abbrev: "CLE", pop: 1.9},
        {tid: 6, cid: 1, did: 3, region: "Dallas", name: "Snipers", abbrev: "DAL", pop: 4.7},
        {tid: 7, cid: 1, did: 4, region: "Denver", name: "High", abbrev: "DEN", pop: 2.2},
        {tid: 8, cid: 0, did: 1, region: "Detroit", name: "Muscle", abbrev: "DET", pop: 4.0},
        {tid: 9, cid: 1, did: 3, region: "Houston", name: "Apollos", abbrev: "HOU", pop: 4.3},
        {tid: 10, cid: 1, did: 5, region: "Las Vegas", name: "Blue Chips", abbrev: "LV", pop: 1.7},
        {tid: 11, cid: 1, did: 5, region: "Los Angeles", name: "Earthquakes", abbrev: "LA", pop: 12.3},
        {tid: 12, cid: 1, did: 3, region: "Mexico City", name: "Aztecs", abbrev: "MXC", pop: 19.4},
        {tid: 13, cid: 0, did: 2, region: "Miami", name: "Cyclones", abbrev: "MIA", pop: 5.4},
        {tid: 14, cid: 1, did: 4, region: "Minneapolis", name: "Blizzards", abbrev: "MIN", pop: 2.6},
        {tid: 15, cid: 0, did: 0, region: "Montreal", name: "Mounties", abbrev: "MON", pop: 4.0},
        {tid: 16, cid: 0, did: 0, region: "New York", name: "Bankers", abbrev: "NYC", pop: 18.7},
        {tid: 17, cid: 0, did: 0, region: "Philadelphia", name: "Cheesesteaks", abbrev: "PHI", pop: 5.4},
        {tid: 18, cid: 1, did: 3, region: "Phoenix", name: "Vultures", abbrev: "PHO", pop: 3.4},
        {tid: 19, cid: 0, did: 1, region: "Pittsburgh", name: "Rivers", abbrev: "PIT", pop: 1.8},
        {tid: 20, cid: 1, did: 4, region: "Portland", name: "Roses", abbrev: "POR", pop: 1.8},
        {tid: 21, cid: 1, did: 5, region: "Sacramento", name: "Gold Rush", abbrev: "SAC", pop: 1.6},
        {tid: 22, cid: 1, did: 5, region: "San Diego", name: "Pandas", abbrev: "SD", pop: 2.9},
        {tid: 23, cid: 1, did: 5, region: "San Francisco", name: "Venture Capitalists", abbrev: "SF", pop: 3.4},
        {tid: 24, cid: 1, did: 4, region: "Seattle", name: "Symphony", abbrev: "SEA", pop: 3.0},
        {tid: 25, cid: 1, did: 3, region: "St. Louis", name: "Spirits", abbrev: "STL", pop: 2.2},
        {tid: 26, cid: 0, did: 2, region: "Tampa", name: "Turtles", abbrev: "TPA", pop: 2.2},
        {tid: 27, cid: 0, did: 0, region: "Toronto", name: "Beavers", abbrev: "TOR", pop: 6.3},
        {tid: 28, cid: 1, did: 4, region: "Vancouver", name: "Whalers", abbrev: "VAN", pop: 2.3},
        {tid: 29, cid: 0, did: 2, region: "Washington", name: "Monuments", abbrev: "WAS", pop: 4.2},
    ];

    for (const t of teams) {
        t.imgURL = `/img/logos/${t.abbrev}.png`;
    }

    teams = addPopRank(teams);

    return teams;
}

/**
 * Clones an object.
 *
 * Taken from http://stackoverflow.com/a/3284324/786644
 */
function deepCopy<T>(obj: T): T {
    if (typeof obj !== "object" || obj === null) { return obj; }
    if (obj.constructor === RegExp) { return obj; }

    const retVal = new obj.constructor();
    for (const key of Object.keys(obj)) {
        retVal[key] = deepCopy(obj[key]);
    }
    return retVal;
}

function error(errorText: React.Element<*> | string, cb: Function) {
    // eslint-disable-next-line global-require
    const views = require('../views');
    const view = views.staticPage('error', 'Error', false, <div>
        <h1>Error</h1>

        {errorText}
    </div>);

    view.get({raw: {}}, () => {
        throw new Error('Fake "next" function - this should never be called!');
    });
    if (cb) {
        cb();
    }
}

/**
 * Display a transient error message as a notification popup.
 *
 * Use error if you need to block the whole page.
 *
 * @memberOf util.helpers
 * @param {string} error Text of the error message to be displayed.
 */
function errorNotify(errorText: string) {
    logEvent(null, {
        type: "error",
        text: errorText,
        saveToDb: false,
    });
}

/**
 * Delete all the things from the global variable g that are not stored in league databases.
 *
 * This is used to clear out values from other leagues, to ensure that the appropriate values are updated in the database when calling league.setGameAttributes.
 *
 * @memberOf util.helpers
 */
function resetG() {
    for (const key of Object.keys(g)) {
        if (g.notInDb.indexOf(key) < 0) {
            delete g[key];
        }
    }
}

/**
 * Ping a counter at basketball-gm.com.
 *
 * This should only do something if it isn't being run from a unit test and it's actually on basketball-gm.com.
 *
 * @memberOf util.helpers
 * @param {string} type Either "league" for a new league, or "season" for a completed season
 */
function bbgmPing(type: 'league' | 'season') {
    if (g.enableLogging && window.ga) {
        if (type === "league") {
            window.ga('send', 'event', 'BBGM', 'New league', String(g.lid));
        } else if (type === "season" && g.autoPlaySeasons === 0) {
            window.ga('send', 'event', 'BBGM', 'Completed season', String(g.season));
            window.ga('send', 'event', 'BBGM', 'Season protocol', window.location.origin);
        }
    }
}

/**
 * Create a URL for a page within a league.
 *
 * @param {Array.<string|number>} components Array of components for the URL after the league ID, which will be combined with / in between.
 * @return {string} URL
 */
function leagueUrl(components: (number | string)[]): string {
    let url = `/l/${g.lid}`;
    for (let i = 0; i < components.length; i++) {
        if (components[i] !== undefined) {
            url += `/${components[i]}`;
        }
    }

    return url;
}

function round(value: number | string, precision: number | string = 0): string {
    return parseFloat(value).toFixed(parseInt(precision, 10));
}

/**
 * Pad an array with nulls or truncate it so that it has a fixed length.
 *
 * @memberOf util.helpers
 * @param {Array} array Input array.
 * @param {number} length Desired length.
 * @return {Array} Original array padded with null or truncated so that it has the required length.
 */
function nullPad<T>(array: (?T)[], length: number): (?T)[] {
    if (array.length > length) {
        return array.slice(0, length);
    }

    while (array.length < length) {
        array.push(null);
    }

    return array;
}

/**
 * Format a number as currency, correctly handling negative values.
 *
 * @memberOf util.helpers
 * @param {number|string} amount Input value.
 * @param {string=} append Suffix to append to the number, like "M" for things like $2M.
 * @param {number|string|undefined} precision Number of decimal places. Default is 2 (like $17.62).
 * @return {string} Formatted currency string.
 */
function formatCurrency(amount: number, append: string = '', precision: number = 2): string {
    if (amount < 0) {
        return `-$${round(Math.abs(amount), precision)}${append}`;
    }
    return `$${round(amount, precision)}${append}`;
}

/**
 * Format a number as an integer with commas in the thousands places.
 */
function numberWithCommas(x: number | string): string {
    return round(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Bound a number so that it can't exceed min and max values.
 *
 * @memberOf util.helpers
 * @param {number} x Input number.
 * @param {number} min Minimum bounding variable.
 * @param {number} max Maximum bounding variable.
 * @return {number} Bounded number.
 */
function bound(x: number, min: number, max: number): number {
    if (x < min) {
        return min;
    }
    if (x > max) {
        return max;
    }
    return x;
}

function pickDesc(pick: Pick): string {
    let desc = `${pick.season} ${pick.round === 1 ? "1st" : "2nd"} round pick`;
    if (pick.tid !== pick.originalTid) {
        desc += ` (from ${g.teamAbbrevsCache[pick.originalTid]})`;
    }

    return desc;
}

function ordinal(x?: ?number): string {
    if (x === undefined || x === null) {
        return '';
    }

    let suffix;
    if (x >= 11 && x <= 13) {
        suffix = "th";
    } else if (x % 10 === 1) {
        suffix = "st";
    } else if (x % 10 === 2) {
        suffix = "nd";
    } else if (x % 10 === 3) {
        suffix = "rd";
    } else {
        suffix = "th";
    }

    return x.toString() + suffix;
}

/**
 * Generate a game log list.
 *
 * @memberOf helpers
 * @param {string} abbrev Abbrev of the team for the list of games.
 * @param {number} season Season for the list of games.
 * @param {number} gid Integer game ID for the box score (a negative number means no box score), which is used only for highlighting the relevant entry in the list.
 * @param {Array.<Object>} gid Array of already-loaded games. If this is not empty, then only new games that are not already in this array will be passed to the callback.
 * @return {Promise.<Array.<Object>>} Resolves to a list of game objects.
 */
async function gameLogList(abbrev: string, season: number, gid: number, loadedGames: GameProcessed[] = []): Promise<GameProcessed[]> {
    const out = validateAbbrev(abbrev);
    const tid = out[0];
    abbrev = out[1];

    let maxGid;
    if (loadedGames.length > 0) {
        maxGid = loadedGames[0].gid; // Load new games
    } else {
        maxGid = -1; // Load all games
    }

    const games = [];

    // This could be made much faster by using a compound index to search for season + team, but that's not supported by IE 10
    await g.dbl.games.index('season').iterate(season, "prev", (game, shortCircuit) => {
        if (game.gid <= maxGid) {
            return shortCircuit();
        }

        let overtime;
        if (game.overtimes === 1) {
            overtime = " (OT)";
        } else if (game.overtimes > 1) {
            overtime = ` (${game.overtimes}OT)`;
        } else {
            overtime = "";
        }

        // Check tid
        if (game.teams[0].tid === tid || game.teams[1].tid === tid) {
            if (game.teams[0].tid === tid) {
                games.push({
                    gid: game.gid,
                    overtime,
                    tid,
                    home: true,
                    oppAbbrev: g.teamAbbrevsCache[game.teams[1].tid],
                    oppPts: game.teams[1].pts,
                    oppTid: game.teams[1].tid,
                    pts: game.teams[0].pts,
                    won: game.teams[0].pts > game.teams[1].pts,
                });
            } else if (game.teams[1].tid === tid) {
                games.push({
                    gid: game.gid,
                    overtime,
                    tid,
                    home: false,
                    oppAbbrev: g.teamAbbrevsCache[game.teams[0].tid],
                    oppPts: game.teams[0].pts,
                    oppTid: game.teams[0].tid,
                    pts: game.teams[1].pts,
                    won: game.teams[1].pts > game.teams[0].pts,
                });
            }
        }
    });

    return games;
}

function formatCompletedGame(game: GameProcessed): GameProcessedCompleted {
    // If not specified, assume user's team is playing
    game.tid = game.tid !== undefined ? game.tid : g.userTid;

    // team0 and team1 are different than they are above! Here it refers to user and opponent, not home and away
    const team0 = {tid: game.tid, abbrev: g.teamAbbrevsCache[game.tid], region: g.teamRegionsCache[game.tid], name: g.teamNamesCache[game.tid], pts: game.pts};
    const team1 = {tid: game.oppTid, abbrev: g.teamAbbrevsCache[game.oppTid], region: g.teamRegionsCache[game.oppTid], name: g.teamNamesCache[game.oppTid], pts: game.oppPts};

    return {
        gid: game.gid,
        overtime: game.overtime,
        score: game.won ? `${team0.pts}-${team1.pts}` : `${team1.pts}-${team0.pts}`,
        teams: game.home ? [team1, team0] : [team0, team1],
        won: game.won,
    };
}


// Calculate the number of games that team is behind team0
type teamWonLost = {lost: number, won: number};
function gb(team0: teamWonLost, team: teamWonLost) {
    return ((team0.won - team0.lost) - (team.won - team.lost)) / 2;
}

function checkNaNs() {
    // Check all properties of an object for NaN
    const checkObject = (obj, foundNaN, replace) => {
        foundNaN = foundNaN !== undefined ? foundNaN : false;
        replace = replace !== undefined ? replace : false;

        for (const prop of Object.keys(obj)) {
            if (typeof obj[prop] === "object" && obj[prop] !== null) {
                foundNaN = checkObject(obj[prop], foundNaN, replace);
            } else if (obj[prop] !== obj[prop]) {
                // NaN check from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isNaN
                foundNaN = true;
                if (replace) {
                    obj[prop] = 0;
                }
            }
        }

        return foundNaN;
    };

    const wrap = (parent: any, name, wrapper) => {
        const original = parent[name];
        parent[name] = wrapper(original);
    };

    const wrapperNaNChecker = _super => {
        return function (obj, ...args) {
            if (checkObject(obj)) {
                const err = new Error("NaN found before writing to IndexedDB");

                if (window.Bugsnag) {
                    window.Bugsnag.notifyException(err, "NaNFound", {
                        details: {
                            objectWithNaN: JSON.stringify(obj, (key, value) => {
                                if (Number.isNaN) {
                                    return "FUCKING NaN RIGHT HERE";
                                }

                                return value;
                            }),
                        },
                    });
                }

                // Hard crash
/*                    gSend = JSON.parse(JSON.stringify(g)); // deepCopy fails for some reason
                delete gSend.teamAbbrevsCache;
                delete gSend.teamRegionsCache;
                delete gSend.teamNamesCache;

                output = "<h1>Critical Error</h1><p>You ran into the infamous NaN bug. But there's good news! You can help fix it! Please email the following information to <a href=\"mailto:commissioner@basketball-gm.com\">commissioner@basketball-gm.com</a> along with any information about what you think might have caused this glitch. If you want to be extra helpful, <a href=\"" + leagueUrl(["export_league"]) + "\">export your league</a> and send that too (if it's huge, upload to Google Drive or Dropbox or whatever). Thanks!</p>";

                output += '<textarea class="form-control" style="height: 300px">';
                output += JSON.stringify({
                    stack: err.stack,
                    input: obj,
                    "this": this,
                    gSend: gSend
                }, (key, value) => {
                    if (value != value) {
                        return "NaN RIGHT HERE";
                    }

                    return value;
                }, 2);
                output += "</textarea>";

                // Find somewhere to show output
                contentNode = document.getElementById("league_content");
                if (!contentNode) {
                    contentNode = document.getElementById("content");
                }
                if (!contentNode) {
                    contentNode = document.body;
                }
                contentNode.innerHTML = output;

                throw err;*/

                // Try to recover gracefully
                checkObject(obj, false, true); // This will update obj
                return _super.call(this, obj, ...args);
            }

            return _super.call(this, obj, ...args);
        };
    };

    wrap(IDBObjectStore.prototype, "add", wrapperNaNChecker);
    wrap(IDBObjectStore.prototype, "put", wrapperNaNChecker);
    wrap(IDBCursor.prototype, "update", wrapperNaNChecker);
}

function gameScore(arg: {[key: string]: number}): string {
    return round(arg.pts + 0.4 * arg.fg - 0.7 * arg.fga - 0.4 * (arg.fta - arg.ft) + 0.7 * arg.orb + 0.3 * (arg.trb - arg.orb) + arg.stl + 0.7 * arg.ast + 0.7 * arg.blk - 0.4 * arg.pf - arg.tov, 1);
}

function plusMinus(arg: number, d: number): string {
    if (isNaN(arg)) { return ""; }
    return (arg > 0 ? "+" : "") + round(arg, d);
}

// Used to fix links in the event log, which will be wrong if a league is exported and then imported
function correctLinkLid(event: {text: string}) {
    event.text = event.text.replace(/\/l\/\d+\//g, `/l/${g.lid}/`);
}

function overtimeCounter(n: number): string {
    switch (n) {
        case 1: return "";
        case 2: return "double";
        case 3: return "triple";
        case 4: return "quadruple";
        case 5: return "quintuple";
        case 6: return "sextuple";
        case 7: return "septuple";
        case 8: return "octuple";
        default: return `a ${ordinal(n)}`;
    }
}

function yearRanges(arr: number[]): string[] {
    if (arr.length <= 1) {
        return arr.map(String);
    }

    const runArr = [];
    const tempArr = [[arr[0]]];

    for (let i = 1; i < arr.length; i++) {
        if (arr[i] - arr[i - 1] > 1) {
            tempArr.push([]);
        }
        tempArr[tempArr.length - 1].push(arr[i]);
    }

    for (let i = 0; i < tempArr.length; i++) {
        // runs of up to 2 consecutive years are displayed individually
        if (tempArr[i].length <= 2) {
            runArr.push(String(tempArr[i][0]));
            if (tempArr[i].length === 2) {
                runArr.push(String(tempArr[i][1]));
            }
        } else {
            // runs of 3 or more are displayed as a range
            runArr.push(`${tempArr[i][0]}-${tempArr[i][tempArr[i].length - 1]}`);
        }
    }

    return runArr;
}

function maybeReuseTx(storeNames: string | string[], mode: string, tx: BackboardTx, cb: Function) {
    if (tx !== undefined && tx !== null) {
        return cb(tx);
    }

    return g.dbl.tx(storeNames, mode, cb);
}

function roundsWonText(playoffRoundsWon: number): string {
    const playoffsByConference = g.confs.length === 2 && !localStorage.getItem('top16playoffs');

    if (playoffRoundsWon === g.numPlayoffRounds) {
        return "League champs";
    }
    if (playoffRoundsWon === g.numPlayoffRounds - 1) {
        return playoffsByConference ? "Conference champs" : "Made finals";
    }
    if (playoffRoundsWon === g.numPlayoffRounds - 2) {
        return playoffsByConference ? "Made conference finals" : "Made semifinals";
    }
    if (playoffRoundsWon >= 1) {
        return `Made ${ordinal(playoffRoundsWon + 1)} round`;
    }
    if (playoffRoundsWon === 0) {
        return "Made playoffs";
    }
    return "";
}

function roundWinp(winp: number): string {
    let output = winp.toFixed(3);

    if (output[0] === "0") {
        // Delete leading 0
        output = output.slice(1, output.length);
    } else {
        // Delete trailing digit if no leading 0
        output = output.slice(0, output.length - 1);
    }

    return output;
}

export {
    validateAbbrev,
    getAbbrev,
    validateTid,
    validateSeason,
    addPopRank,
    getTeamsDefault,
    deepCopy,
    error,
    errorNotify,
    resetG,
    bbgmPing,
    round,
    nullPad,
    formatCurrency,
    numberWithCommas,
    bound,
    leagueUrl,
    pickDesc,
    ordinal,
    gameLogList,
    formatCompletedGame,
    gb,
    checkNaNs,
    gameScore,
    plusMinus,
    correctLinkLid,
    overtimeCounter,
    yearRanges,
    maybeReuseTx,
    roundsWonText,
    roundWinp,
};
