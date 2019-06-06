// @flow

// This should never be directly imported. Instead, ui/util/helpers and ui/worker/helpers should be used.

import type { TeamBasic } from "./types";

/**
 * Take a list of teams (similar to the output of getTeamsDefault) and add popRank properties, where 1 is the largest population and teams.length is the smallest.
 *
 * @param {Array.<Object>} teams Teams without popRank properties.
 * @return {Array.<Object>} Teams with added popRank properties.
 */
function addPopRank(teams: any[]): any[] {
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

const gameScore = (arg: { [key: string]: number }): number => {
    return (
        arg.pts +
        0.4 * arg.fg -
        0.7 * arg.fga -
        0.4 * (arg.fta - arg.ft) +
        0.7 * arg.orb +
        0.3 * arg.drb +
        arg.stl +
        0.7 * arg.ast +
        0.7 * arg.blk -
        0.4 * arg.pf -
        arg.tov
    );
};

function getTeamsDefault(): any[] {
    let teams: TeamBasic[];

    if (process.env.SPORT === "basketball") {
        teams = [
            {
                tid: 0,
                cid: 0,
                did: 2,
                region: "Atlanta",
                name: "Gold Club",
                abbrev: "ATL",
                pop: 4.3,
                imgURL: undefined,
            },
            {
                tid: 1,
                cid: 0,
                did: 2,
                region: "Baltimore",
                name: "Crabs",
                abbrev: "BAL",
                pop: 2.2,
                imgURL: undefined,
            },
            {
                tid: 2,
                cid: 0,
                did: 0,
                region: "Boston",
                name: "Massacre",
                abbrev: "BOS",
                pop: 4.2,
                imgURL: undefined,
            },
            {
                tid: 3,
                cid: 0,
                did: 1,
                region: "Chicago",
                name: "Whirlwinds",
                abbrev: "CHI",
                pop: 8.6,
                imgURL: undefined,
            },
            {
                tid: 4,
                cid: 0,
                did: 1,
                region: "Cincinnati",
                name: "Riots",
                abbrev: "CIN",
                pop: 1.6,
                imgURL: undefined,
            },
            {
                tid: 5,
                cid: 0,
                did: 1,
                region: "Cleveland",
                name: "Curses",
                abbrev: "CLE",
                pop: 1.8,
                imgURL: undefined,
            },
            {
                tid: 6,
                cid: 1,
                did: 3,
                region: "Dallas",
                name: "Snipers",
                abbrev: "DAL",
                pop: 5.1,
                imgURL: undefined,
            },
            {
                tid: 7,
                cid: 1,
                did: 4,
                region: "Denver",
                name: "High",
                abbrev: "DEN",
                pop: 2.4,
                imgURL: undefined,
            },
            {
                tid: 8,
                cid: 0,
                did: 1,
                region: "Detroit",
                name: "Muscle",
                abbrev: "DET",
                pop: 3.7,
                imgURL: undefined,
            },
            {
                tid: 9,
                cid: 1,
                did: 3,
                region: "Houston",
                name: "Apollos",
                abbrev: "HOU",
                pop: 4.9,
                imgURL: undefined,
            },
            {
                tid: 10,
                cid: 1,
                did: 5,
                region: "Las Vegas",
                name: "Blue Chips",
                abbrev: "LV",
                pop: 1.9,
                imgURL: undefined,
            },
            {
                tid: 11,
                cid: 1,
                did: 5,
                region: "Los Angeles",
                name: "Earthquakes",
                abbrev: "LA",
                pop: 12.1,
                imgURL: undefined,
            },
            {
                tid: 12,
                cid: 1,
                did: 3,
                region: "Mexico City",
                name: "Aztecs",
                abbrev: "MXC",
                pop: 19.4,
                imgURL: undefined,
            },
            {
                tid: 13,
                cid: 0,
                did: 2,
                region: "Miami",
                name: "Cyclones",
                abbrev: "MIA",
                pop: 5.5,
                imgURL: undefined,
            },
            {
                tid: 14,
                cid: 1,
                did: 4,
                region: "Minneapolis",
                name: "Blizzard",
                abbrev: "MIN",
                pop: 2.7,
                imgURL: undefined,
            },
            {
                tid: 15,
                cid: 0,
                did: 0,
                region: "Montreal",
                name: "Mounties",
                abbrev: "MON",
                pop: 4.0,
                imgURL: undefined,
            },
            {
                tid: 16,
                cid: 0,
                did: 0,
                region: "New York",
                name: "Bankers",
                abbrev: "NYC",
                pop: 18.4,
                imgURL: undefined,
            },
            {
                tid: 17,
                cid: 0,
                did: 0,
                region: "Philadelphia",
                name: "Cheesesteaks",
                abbrev: "PHI",
                pop: 5.4,
                imgURL: undefined,
            },
            {
                tid: 18,
                cid: 1,
                did: 3,
                region: "Phoenix",
                name: "Vultures",
                abbrev: "PHO",
                pop: 3.6,
                imgURL: undefined,
            },
            {
                tid: 19,
                cid: 0,
                did: 1,
                region: "Pittsburgh",
                name: "Rivers",
                abbrev: "PIT",
                pop: 1.7,
                imgURL: undefined,
            },
            {
                tid: 20,
                cid: 1,
                did: 4,
                region: "Portland",
                name: "Roses",
                abbrev: "POR",
                pop: 1.8,
                imgURL: undefined,
            },
            {
                tid: 21,
                cid: 1,
                did: 5,
                region: "Sacramento",
                name: "Gold Rush",
                abbrev: "SAC",
                pop: 1.7,
                imgURL: undefined,
            },
            {
                tid: 22,
                cid: 1,
                did: 5,
                region: "San Diego",
                name: "Pandas",
                abbrev: "SD",
                pop: 3.0,
                imgURL: undefined,
            },
            {
                tid: 23,
                cid: 1,
                did: 5,
                region: "San Francisco",
                name: "Venture Capitalists",
                abbrev: "SF",
                pop: 3.3,
                imgURL: undefined,
            },
            {
                tid: 24,
                cid: 1,
                did: 4,
                region: "Seattle",
                name: "Symphony",
                abbrev: "SEA",
                pop: 3.1,
                imgURL: undefined,
            },
            {
                tid: 25,
                cid: 1,
                did: 3,
                region: "St. Louis",
                name: "Spirits",
                abbrev: "STL",
                pop: 2.2,
                imgURL: undefined,
            },
            {
                tid: 26,
                cid: 0,
                did: 2,
                region: "Tampa",
                name: "Turtles",
                abbrev: "TPA",
                pop: 2.4,
                imgURL: undefined,
            },
            {
                tid: 27,
                cid: 0,
                did: 0,
                region: "Toronto",
                name: "Beavers",
                abbrev: "TOR",
                pop: 6.3,
                imgURL: undefined,
            },
            {
                tid: 28,
                cid: 1,
                did: 4,
                region: "Vancouver",
                name: "Whalers",
                abbrev: "VAN",
                pop: 2.3,
                imgURL: undefined,
            },
            {
                tid: 29,
                cid: 0,
                did: 2,
                region: "Washington",
                name: "Monuments",
                abbrev: "WAS",
                pop: 4.6,
                imgURL: undefined,
            },
        ];
    } else {
        teams = [
            {
                tid: 0,
                cid: 1,
                did: 6,
                region: "Atlanta",
                name: "Gold Club",
                abbrev: "ATL",
                pop: 4.3,
                imgURL: undefined,
            },
            {
                tid: 1,
                cid: 0,
                did: 0,
                region: "Baltimore",
                name: "Crabs",
                abbrev: "BAL",
                pop: 2.2,
                imgURL: undefined,
            },
            {
                tid: 2,
                cid: 0,
                did: 0,
                region: "Boston",
                name: "Massacre",
                abbrev: "BOS",
                pop: 4.2,
                imgURL: undefined,
            },
            {
                tid: 3,
                cid: 1,
                did: 5,
                region: "Chicago",
                name: "Whirlwinds",
                abbrev: "CHI",
                pop: 8.6,
                imgURL: undefined,
            },
            {
                tid: 4,
                cid: 0,
                did: 1,
                region: "Cincinnati",
                name: "Riots",
                abbrev: "CIN",
                pop: 1.6,
                imgURL: undefined,
            },
            {
                tid: 5,
                cid: 0,
                did: 1,
                region: "Cleveland",
                name: "Curses",
                abbrev: "CLE",
                pop: 1.8,
                imgURL: undefined,
            },
            {
                tid: 6,
                cid: 1,
                did: 4,
                region: "Dallas",
                name: "Snipers",
                abbrev: "DAL",
                pop: 5.1,
                imgURL: undefined,
            },
            {
                tid: 7,
                cid: 0,
                did: 3,
                region: "Denver",
                name: "High",
                abbrev: "DEN",
                pop: 2.4,
                imgURL: undefined,
            },
            {
                tid: 8,
                cid: 1,
                did: 5,
                region: "Detroit",
                name: "Muscle",
                abbrev: "DET",
                pop: 3.7,
                imgURL: undefined,
            },
            {
                tid: 9,
                cid: 0,
                did: 2,
                region: "Houston",
                name: "Apollos",
                abbrev: "HOU",
                pop: 4.9,
                imgURL: undefined,
            },
            {
                tid: 10,
                cid: 0,
                did: 2,
                region: "Kansas City",
                name: "Sauce",
                abbrev: "KC",
                pop: 1.5,
                imgURL: undefined,
            },
            {
                tid: 11,
                cid: 0,
                did: 2,
                region: "Las Vegas",
                name: "Blue Chips",
                abbrev: "LV",
                pop: 1.9,
                imgURL: undefined,
            },
            {
                tid: 12,
                cid: 1,
                did: 7,
                region: "Los Angeles",
                name: "Earthquakes",
                abbrev: "LA",
                pop: 12.1,
                imgURL: undefined,
            },
            {
                tid: 13,
                cid: 1,
                did: 6,
                region: "Mexico City",
                name: "Aztecs",
                abbrev: "MXC",
                pop: 19.4,
                imgURL: undefined,
            },
            {
                tid: 14,
                cid: 0,
                did: 0,
                region: "Miami",
                name: "Cyclones",
                abbrev: "MIA",
                pop: 5.5,
                imgURL: undefined,
            },
            {
                tid: 15,
                cid: 1,
                did: 5,
                region: "Minneapolis",
                name: "Blizzard",
                abbrev: "MIN",
                pop: 2.7,
                imgURL: undefined,
            },
            {
                tid: 16,
                cid: 0,
                did: 1,
                region: "Montreal",
                name: "Mounties",
                abbrev: "MON",
                pop: 4.0,
                imgURL: undefined,
            },
            {
                tid: 17,
                cid: 1,
                did: 4,
                region: "New York",
                name: "Bankers",
                abbrev: "NYC",
                pop: 18.4,
                imgURL: undefined,
            },
            {
                tid: 18,
                cid: 1,
                did: 4,
                region: "Philadelphia",
                name: "Cheesesteaks",
                abbrev: "PHI",
                pop: 5.4,
                imgURL: undefined,
            },
            {
                tid: 19,
                cid: 0,
                did: 2,
                region: "Phoenix",
                name: "Vultures",
                abbrev: "PHO",
                pop: 3.6,
                imgURL: undefined,
            },
            {
                tid: 20,
                cid: 0,
                did: 0,
                region: "Pittsburgh",
                name: "Rivers",
                abbrev: "PIT",
                pop: 1.7,
                imgURL: undefined,
            },
            {
                tid: 21,
                cid: 0,
                did: 3,
                region: "Portland",
                name: "Roses",
                abbrev: "POR",
                pop: 1.8,
                imgURL: undefined,
            },
            {
                tid: 22,
                cid: 1,
                did: 7,
                region: "Sacramento",
                name: "Gold Rush",
                abbrev: "SAC",
                pop: 1.7,
                imgURL: undefined,
            },
            {
                tid: 23,
                cid: 1,
                did: 6,
                region: "San Antonio",
                name: "Churros",
                abbrev: "SA",
                pop: 1.8,
                imgURL: undefined,
            },
            {
                tid: 24,
                cid: 0,
                did: 3,
                region: "San Diego",
                name: "Pandas",
                abbrev: "SD",
                pop: 3.0,
                imgURL: undefined,
            },
            {
                tid: 25,
                cid: 1,
                did: 7,
                region: "San Francisco",
                name: "Venture Capitalists",
                abbrev: "SF",
                pop: 3.3,
                imgURL: undefined,
            },
            {
                tid: 26,
                cid: 1,
                did: 7,
                region: "Seattle",
                name: "Symphony",
                abbrev: "SEA",
                pop: 3.1,
                imgURL: undefined,
            },
            {
                tid: 27,
                cid: 1,
                did: 5,
                region: "St. Louis",
                name: "Spirits",
                abbrev: "STL",
                pop: 2.2,
                imgURL: undefined,
            },
            {
                tid: 28,
                cid: 1,
                did: 6,
                region: "Tampa",
                name: "Turtles",
                abbrev: "TPA",
                pop: 2.4,
                imgURL: undefined,
            },
            {
                tid: 29,
                cid: 0,
                did: 1,
                region: "Toronto",
                name: "Beavers",
                abbrev: "TOR",
                pop: 6.3,
                imgURL: undefined,
            },
            {
                tid: 30,
                cid: 0,
                did: 3,
                region: "Vancouver",
                name: "Whalers",
                abbrev: "VAN",
                pop: 2.3,
                imgURL: undefined,
            },
            {
                tid: 31,
                cid: 1,
                did: 4,
                region: "Washington",
                name: "Monuments",
                abbrev: "WAS",
                pop: 4.6,
                imgURL: undefined,
            },
        ];
    }

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
    if (typeof obj !== "object" || obj === null) {
        return obj;
    }
    if (obj.constructor === RegExp) {
        return obj;
    }

    const retVal = new obj.constructor();
    for (const key of Object.keys(obj)) {
        retVal[key] = deepCopy(obj[key]);
    }
    return retVal;
}

// Hacky solution to http://stackoverflow.com/q/39683076/786644
function keys<T: string>(obj: any): Array<T> {
    // $FlowFixMe
    return Object.keys(obj);
}

/**
 * Create a URL for a page within a league.
 *
 * @param {Array.<string|number>} components Array of components for the URL after the league ID, which will be combined with / in between.
 * @return {string} URL
 */
function leagueUrlFactory(
    lid: number,
    components: (number | string)[],
): string {
    let url = `/l/${lid}`;
    for (let i = 0; i < components.length; i++) {
        if (components[i] !== undefined) {
            url += `/${components[i]}`;
        }
    }

    return url;
}

/**
 * Format a number as currency, correctly handling negative values.
 *
 * @memberOf util.helpers
 * @param {number} amount Input value.
 * @param {string=} append Suffix to append to the number, like "M" for things like $2M.
 * @param {number|string|undefined} precision Number of decimal places. Default is 2 (like $17.62).
 * @return {string} Formatted currency string.
 */
function formatCurrency(
    amount: number,
    append: string = "",
    precision: number = 2,
): string {
    if (amount < 0) {
        return `-$${Math.abs(amount).toFixed(precision)}${append}`;
    }
    if (append === "M" && amount > 1000) {
        amount /= 1000;
        append = "B";
    }
    return `$${amount.toFixed(precision)}${append}`;
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

function ordinal(x?: ?number): string {
    if (x === undefined || x === null) {
        return "";
    }

    let suffix;
    if (x % 100 >= 11 && x % 100 <= 13) {
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
            runArr.push(
                `${tempArr[i][0]}-${tempArr[i][tempArr[i].length - 1]}`,
            );
        }
    }

    return runArr;
}

function roundWinp(winp: number): string {
    let output = winp.toFixed(3);

    if (output[0] === "0") {
        // Delete leading 0
        output = output.slice(1, output.length);
    } else if (output[0] !== "-") {
        // Delete trailing digit if positive and no leading 0
        output = output.slice(0, output.length - 1);
    }

    return output;
}

/**
 * Will a player negotiate with a team, or not?
 *
 * @param {number} amount Player's desired contract amount, already adjusted for mood as in amountWithMood, in thousands of dollars
 * @param {number} mood Player's mood towards the team in question.
 * @return {boolean} Answer to the question.
 */
const refuseToNegotiate = (
    amount: number,
    mood: number,
    playersRefuseToNegotiate: boolean,
    rookie?: boolean = false,
): boolean => {
    if (!playersRefuseToNegotiate) {
        return false;
    }

    if (rookie) {
        return false;
    }

    return amount * mood > 9500;
};

const upperCaseFirstLetter = (string: string): string => {
    return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
};

export default {
    addPopRank,
    gameScore,
    getTeamsDefault,
    deepCopy,
    formatCurrency,
    bound,
    keys,
    leagueUrlFactory,
    ordinal,
    yearRanges,
    roundWinp,
    refuseToNegotiate,
    upperCaseFirstLetter,
};
