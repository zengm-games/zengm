// @flow

import { PHASE, PLAYER, g, helpers } from "../../../common";
import { finances } from "../../core";
import augmentPartialPlayer from "./augmentPartialPlayer";
import bonus from "./bonus";
import develop from "./develop";
import genFuzz from "./genFuzz";
import generate from "./generate";
import pos from "./pos";
import shouldRetire from "./shouldRetire";
import skills from "./skills";
import value from "./value";
import { idb } from "../../db";
import * as names from "../../../data/names";
import { injuries, logEvent, random } from "../../util";
import type {
    Conditions,
    GamePlayer,
    GameResults,
    Phase,
    Player,
    PlayerContract,
    PlayerInjury,
    PlayerRatings,
    PlayerSalary, // eslint-disable-line no-unused-vars
    PlayerStats,
    PlayerWithoutPid,
} from "../../../common/types";

let playerNames;

/**
 * Limit a rating to between 0 and 100.
 *
 * @memberOf core.player
 * @param {number} rating Input rating.
 * @return {number} If rating is below 0, 0. If rating is above 100, 100. Otherwise, rating.
 */
function limitRating(rating: number): number {
    if (rating > 100) {
        return 100;
    }
    if (rating < 0) {
        return 0;
    }
    return Math.floor(rating);
}

/**
 * Calculates the overall rating by averaging together all the other ratings.
 *
 * @memberOf core.player
 * @param {Object.<string, number>} ratings Player's ratings object.
 * @return {number} Overall rating.
 */
function ovr(ratings: PlayerRatings): number {
    // This formula is loosely based on linear regression of ratings to zscore(ws48)+zscore(per):
    const r =
        (5 * ratings.hgt +
            1 * ratings.stre +
            4 * ratings.spd +
            2 * ratings.jmp +
            1 * ratings.endu +
            1 * ratings.ins +
            2 * ratings.dnk +
            1 * ratings.ft +
            1 * ratings.fg +
            3 * ratings.tp +
            7 * ratings.oiq +
            3 * ratings.diq +
            3 * ratings.drb +
            3 * ratings.pss +
            1 * ratings.reb) /
        38;

    // Fudge factor to keep ovr ratings the same as they used to be (back before 2018 ratings rescaling)
    // +8 at 68
    // +4 at 50
    // -5 at 42
    // -10 at 31
    let fudgeFactor = 0;
    if (r >= 68) {
        fudgeFactor = 8;
    } else if (r >= 50) {
        fudgeFactor = 4 + (r - 50) * (4 / 18);
    } else if (r >= 42) {
        fudgeFactor = -5 + (r - 42) * (10 / 8);
    } else if (r >= 31) {
        fudgeFactor = -5 - (42 - r) * (5 / 11);
    } else {
        fudgeFactor = -10;
    }

    return helpers.bound(Math.round(r + fudgeFactor), 0, 100);
}

function fuzzRating(rating: number, fuzz: number): number {
    // Turn off fuzz in multi team mode, because it doesn't have any meaning there in its current form. The check for
    // existence of variables is because this is sometimes called in league upgrade code when g is not available and
    // would be difficult to make available due to Firefox promise/IDB/worker issues.
    if ((g.hasOwnProperty("userTids") && g.userTids.length > 1) || g.godMode) {
        fuzz = 0;
    }

    return Math.round(helpers.bound(rating + fuzz, 0, 100));
}

/**
 * Generate a contract for a player.
 *
 * @memberOf core.player
 * @param {Object} ratings Player object. At a minimum, this must have one entry in the ratings array.
 * @param {boolean} randomizeExp If true, then it is assumed that some random amount of years has elapsed since the contract was signed, thus decreasing the expiration date. This is used when generating players in a new league.
 * @return {Object.<string, number>} Object containing two properties with integer values, "amount" with the contract amount in thousands of dollars and "exp" with the contract expiration year.
 */
function genContract(
    p: Player | PlayerWithoutPid,
    randomizeExp: boolean = false,
    randomizeAmount: boolean = true,
    noLimit: boolean = false,
): PlayerContract {
    const ratings = p.ratings[p.ratings.length - 1];

    let amount =
        (p.value / 100 - 0.47) * 3.5 * (g.maxContract - g.minContract) +
        g.minContract;
    if (randomizeAmount) {
        amount *= helpers.bound(random.realGauss(1, 0.1), 0, 2); // Randomize
    }

    // Expiration
    // Players with high potentials want short contracts
    const potentialDifference = Math.round((ratings.pot - ratings.ovr) / 4.0);
    let years = 5 - potentialDifference;
    if (years < 2) {
        years = 2;
    }
    // Bad players can only ask for short deals
    if (ratings.pot < 40) {
        years = 1;
    } else if (ratings.pot < 50) {
        years = 2;
    } else if (ratings.pot < 60) {
        years = 3;
    }

    // Randomize expiration for contracts generated at beginning of new game
    if (randomizeExp) {
        years = random.randInt(1, years);

        // Make rookie contracts more reasonable
        if (g.season - p.born.year <= 21) {
            amount /= 3;
        }
    }

    const expiration = g.season + years - 1;

    if (!noLimit) {
        if (amount < g.minContract * 1.1) {
            amount = g.minContract;
        } else if (amount > g.maxContract) {
            amount = g.maxContract;
        }
    } else if (amount < 0) {
        // Well, at least keep it positive
        amount = 0;
    }

    amount = 50 * Math.round(amount / 50); // Make it a multiple of 50k

    return { amount, exp: expiration };
}

/**
 * Store a contract in a player object.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @param {Object} contract Contract object with two properties,    exp (year) and amount (thousands of dollars).
 * @param {boolean} signed Is this an official signed contract (true), or just part of a negotiation (false)?
 * @return {Object} Updated player object.
 */
function setContract(
    p: Player | PlayerWithoutPid,
    contract: PlayerContract,
    signed: boolean,
) {
    p.contract = contract;

    // Only write to salary log if the player is actually signed. Otherwise, we're just generating a value for a negotiation.
    if (signed) {
        // Is this contract beginning with an in-progress season, or next season?
        let start = g.season;
        if (g.phase > PHASE.AFTER_TRADE_DEADLINE) {
            start += 1;
        }

        for (let i = start; i <= p.contract.exp; i++) {
            p.salaries.push({ season: i, amount: contract.amount });
        }
    }
}

/**
 * Calculates the base "mood" factor for any free agent towards a team.
 *
 * This base mood is then modulated for an individual player in addToFreeAgents.
 *
 * @return {Promise} Array of base moods, one for each team.
 */
async function genBaseMoods(): Promise<number[]> {
    const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
        "teamSeasonsBySeasonTid",
        [`${g.season}`, `${g.season},Z`],
    );

    return teamSeasons.map(teamSeason => {
        // Special case for winning a title - basically never refuse to re-sign unless a miracle occurs
        if (
            teamSeason.playoffRoundsWon === g.numPlayoffRounds &&
            Math.random() < 0.99
        ) {
            return -0.25; // Should guarantee no refusing to re-sign
        }

        let baseMood = 0;

        // Hype
        baseMood += 0.5 * (1 - teamSeason.hype);

        // Facilities - fuck it, just use most recent rank
        baseMood +=
            0.1 *
            (finances.getRankLastThree([teamSeason], "expenses", "facilities") -
                1) /
            (g.numTeams - 1);

        // Population
        baseMood += 0.2 * (1 - teamSeason.pop / 10);

        // Randomness
        baseMood += random.uniform(-0.2, 0.4);

        baseMood = helpers.bound(baseMood, 0, 1.2);

        return baseMood;
    });
}

/**
 * Adds player to the free agents list.
 *
 * This should be THE ONLY way that players are added to the free agents
 * list, because this will also calculate their demanded contract and mood.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @param {?number} phase An integer representing the game phase to consider this transaction under (defaults to g.phase if null).
 * @param {Array.<number>} baseMoods Vector of base moods for each team from 0 to 1, as generated by genBaseMoods.
 */
async function addToFreeAgents(
    p: Player | PlayerWithoutPid,
    phase: Phase,
    baseMoods: number[],
) {
    phase = phase !== null ? phase : g.phase;

    const pr = p.ratings[p.ratings.length - 1];
    setContract(p, genContract(p), false);

    // Set initial player mood towards each team
    p.freeAgentMood = baseMoods.map(mood => {
        if (pr.ovr + pr.pot < 80) {
            // Bad players don't have the luxury to be choosy about teams
            return 0;
        }
        if (phase === PHASE.RESIGN_PLAYERS) {
            // More likely to re-sign your own players
            return helpers.bound(mood + random.uniform(-1, 0.5), 0, 1000);
        }
        return helpers.bound(mood + random.uniform(-1, 1.5), 0, 1000);
    });

    // During regular season, or before season starts, allow contracts for
    // just this year.
    if (phase > PHASE.AFTER_TRADE_DEADLINE) {
        p.contract.exp += 1;
    }

    p.tid = PLAYER.FREE_AGENT;

    p.ptModifier = 1; // Reset

    await idb.cache.players.put(p);
    idb.cache.markDirtyIndexes("players");
}

/**
 * Release player.
 *
 * This keeps track of what the player's current team owes him, and then calls player.addToFreeAgents.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @param {boolean} justDrafted True if the player was just drafted by his current team and the regular season hasn't started yet. False otherwise. If True, then the player can be released without paying his salary.
 * @return {Promise}
 */
async function release(p: Player, justDrafted: boolean) {
    // Keep track of player salary even when he's off the team, but make an exception for players who were just drafted
    // Was the player just drafted?
    if (!justDrafted) {
        await idb.cache.releasedPlayers.add({
            pid: p.pid,
            tid: p.tid,
            contract: helpers.deepCopy(p.contract),
        });
    } else {
        // Clear player salary log if just drafted, because this won't be paid.
        p.salaries = [];
    }

    logEvent({
        type: "release",
        text: `The <a href="${helpers.leagueUrl([
            "roster",
            g.teamAbbrevsCache[p.tid],
            g.season,
        ])}">${
            g.teamNamesCache[p.tid]
        }</a> released <a href="${helpers.leagueUrl(["player", p.pid])}">${
            p.firstName
        } ${p.lastName}</a>.`,
        showNotification: false,
        pids: [p.pid],
        tids: [p.tid],
    });

    const baseMoods = await genBaseMoods();
    await addToFreeAgents(p, g.phase, baseMoods);
}

function name(): { country: string, firstName: string, lastName: string } {
    if (playerNames === undefined) {
        // This makes it wait until g is loaded before calling names.load, so user-defined names will be used if provided
        playerNames = names.load();
    }

    // Country
    const cRand = random.uniform(
        0,
        playerNames.countries[playerNames.countries.length - 1][1],
    );
    const countryRow = playerNames.countries.find(row => row[1] >= cRand);
    if (countryRow === undefined) {
        throw new Error(`Undefined countryRow (cRand=${cRand}`);
    }
    const country = countryRow[0];

    // First name
    const fnRand = random.uniform(
        0,
        playerNames.first[country][playerNames.first[country].length - 1][1],
    );
    const firstNameRow = playerNames.first[country].find(
        row => row[1] >= fnRand,
    );
    if (firstNameRow === undefined) {
        throw new Error(`Undefined firstNameRow (fnRand=${fnRand}`);
    }
    const firstName = firstNameRow[0];

    // Last name
    const lnRand = random.uniform(
        0,
        playerNames.last[country][playerNames.last[country].length - 1][1],
    );
    const lastNameRow = playerNames.last[country].find(row => row[1] >= lnRand);
    if (lastNameRow === undefined) {
        throw new Error(`Undefined lastNameRow (lnRand=${lnRand}`);
    }
    const lastName = lastNameRow[0];

    return {
        country,
        firstName,
        lastName,
    };
}

/**
 * Add a new row of ratings to a player object.
 *
 * There should be one ratings row for each year a player is not retired, and a new row should be added for each non-retired player at the start of a season.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @param {number} scoutingRank Between 1 and g.numTeams (default 30), the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree.
 * @return {Object} Updated player object.
 */
function addRatingsRow(p: Player | PlayerWithoutPid, scoutingRank: number) {
    const newRatings = Object.assign({}, p.ratings[p.ratings.length - 1]);
    newRatings.season = g.season;
    newRatings.fuzz = (newRatings.fuzz + genFuzz(scoutingRank)) / 2;
    p.ratings.push(newRatings);
}

/**
 * Add a new row of stats to the playerStats database.
 *
 * A row contains stats for unique values of (pid, team, season, playoffs). So new rows need to be added when a player joins a new team, when a new season starts, or when a player's team makes the playoffs. The team ID in p.tid and player ID in p.pid will be used in the stats row, so if a player is changing teams, update p.tid before calling this.
 *
 * Additionally, `p.statsTids` is mutated to reflect the new row, but `p` is NOT saved to the database! So make sure you do that after calling this function. (Or before would be fine too probably, it'd still get marked dirty and flush from cache).
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @param {=boolean} playoffs Is this stats row for the playoffs or not? Default false.
 */
async function addStatsRow(p: Player, playoffs?: boolean = false) {
    const statsRow = {
        pid: p.pid,
        season: g.season,
        tid: p.tid,
        playoffs,
        gp: 0,
        gs: 0,
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
        pm: 0,
        orb: 0,
        drb: 0,
        ast: 0,
        tov: 0,
        stl: 0,
        blk: 0,
        ba: 0,
        pf: 0,
        pts: 0,
        per: 0,
        ewa: 0,
        yearsWithTeam: 1,
        astp: 0,
        blkp: 0,
        drbp: 0,
        orbp: 0,
        stlp: 0,
        trbp: 0,
        usgp: 0,
        drtg: 0,
        ortg: 0,
        dws: 0,
        ows: 0,
    };

    p.statsTids.push(p.tid);
    p.statsTids = Array.from(new Set(p.statsTids));

    // Calculate yearsWithTeam
    const playerStats = (await idb.cache.playerStats.indexGetAll(
        "playerStatsAllByPid",
        p.pid,
    )).filter(ps => !ps.playoffs);
    if (playerStats.length > 0) {
        const i = playerStats.length - 1;
        if (
            playerStats[i].season === g.season - 1 &&
            playerStats[i].tid === p.tid
        ) {
            statsRow.yearsWithTeam = playerStats[i].yearsWithTeam + 1;
        }
    }

    await idb.cache.playerStats.add(statsRow);
}

const heightToRating = (heightInInches: number) => {
    // Min/max for hgt rating.  Displayed height ranges from 4'6" to 9'0", though we might never see the true extremes
    const minHgt = 66; // 5'6"
    const maxHgt = 93; // 7'9"
    return Math.round(
        helpers.bound(
            100 * (heightInInches - minHgt) / (maxHgt - minHgt),
            0,
            100,
        ),
    );
};

/**
 * Pick injury type and duration.
 *
 * This depends on core.data.injuries, health expenses, and randomness.
 *
 * @param {number} healthRank Between 1 and g.numTeams (default 30), 1 if the player's team has the highest health spending this season and g.numTeams if the player's team has the lowest.
 * @return {Object} Injury object (type and gamesRemaining)
 */
function injury(healthRank: number): PlayerInjury {
    const rand = random.uniform(0, 10882);
    const i = injuries.cumSum.findIndex(cs => cs >= rand);

    return {
        type: injuries.types[i],
        gamesRemaining: Math.round(
            (0.7 * (healthRank - 1) / (g.numTeams - 1) + 0.65) *
                random.uniform(0.25, 1.75) *
                injuries.gamesRemainings[i],
        ),
    };
}

/**
 * How many seasons are left on this contract? The answer can be a fraction if the season is partially over
 *
 * @memberOf core.player
 * @param {Object} exp Contract expiration year.
 * @return {number} numGamesRemaining Number of games remaining in the current season (0 to g.numGames).
 */
function contractSeasonsRemaining(
    exp: number,
    numGamesRemaining: number,
): number {
    let frac = numGamesRemaining / g.numGames;
    if (frac > 1) {
        frac = 1;
    } // This only happens if the user changed g.numGames mid season
    return exp - g.season + frac;
}

/**
 * Is a player worthy of the Hall of Fame?
 *
 * This calculation is based on http://espn.go.com/nba/story/_/id/8736873/nba-experts-rebuild-springfield-hall-fame-espn-magazine except it includes each playoff run as a separate season.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @return {boolean} Hall of Fame worthy?
 */
function madeHof(p: Player, playerStats: PlayerStats[]): boolean {
    // Average together WS and EWA
    const winShares = playerStats.map(ps => {
        let sum = 0;

        if (typeof ps.dws === "number") {
            sum += ps.dws;
        }
        if (typeof ps.ows === "number") {
            sum += ps.ows;
        }
        if (typeof ps.ewa === "number") {
            sum += ps.ewa;
        }

        return sum / 2;
    });

    // Calculate career WS and "dominance factor" DF (top 5 years WS - 50)
    winShares.sort((a, b) => b - a); // Descending order
    let total = 0;
    let df = -50;
    for (let i = 0; i < winShares.length; i++) {
        total += winShares[i];
        if (i < 5) {
            df += winShares[i];
        }
    }

    // Fudge factor for players generated when the league started
    const fudgeSeasons = g.startingSeason - p.draft.year - 5;
    if (fudgeSeasons > 0) {
        total += winShares[0] * fudgeSeasons;
    }

    // Final formula
    return total + df > 100;
}

async function updateValues(
    p: Player | PlayerWithoutPid,
    psOverride?: PlayerStats[],
) {
    let playerStats;

    if (psOverride) {
        // Only when creating new league from file, since no cache yet then
        playerStats = psOverride.filter(ps => !ps.playoffs);
    } else if (typeof p.pid === "number") {
        playerStats = (await idb.cache.playerStats.indexGetAll(
            "playerStatsAllByPid",
            p.pid,
        )).filter(ps => !ps.playoffs);
    } else {
        // New player objects don't have pids let alone stats, so just skip
        playerStats = [];
    }

    // Sort ascending, just in case. This might be slightly wrong for traded players, but that's better than being horribly wrong if somehow the stats array is out of order.
    playerStats.sort((a, b) => a.season - b.season);

    p.value = value(p, playerStats);
    p.valueNoPot = value(p, playerStats, { noPot: true });
    p.valueFuzz = value(p, playerStats, { fuzz: true });
    p.valueNoPotFuzz = value(p, playerStats, { noPot: true, fuzz: true });
    p.valueWithContract = value(p, playerStats, { withContract: true });
}

/**
 * Have a player retire, including all event and HOF bookkeeping.
 *
 * This just updates a player object. You need to write it to the database after.
 *
 * @memberOf core.player
 * @param {IDBTransaction} ot An IndexedDB transaction on events.
 * @param {Object} p Player object.
 * @return {Object} p Updated (retired) player object.
 */
function retire(
    p: Player,
    playerStats: PlayerStats[],
    conditions?: Conditions,
    retiredNotification?: boolean = true,
) {
    if (conditions && retiredNotification) {
        logEvent(
            {
                type: "retired",
                text: `<a href="${helpers.leagueUrl(["player", p.pid])}">${
                    p.firstName
                } ${p.lastName}</a> retired.`,
                showNotification: p.tid === g.userTid,
                pids: [p.pid],
                tids: [p.tid],
            },
            conditions,
        );
    }

    p.tid = PLAYER.RETIRED;
    p.retiredYear = g.season;

    // Add to Hall of Fame?
    if (conditions && madeHof(p, playerStats)) {
        p.hof = true;
        p.awards.push({
            season: g.season,
            type: "Inducted into the Hall of Fame",
        });
        logEvent(
            {
                type: "hallOfFame",
                text: `<a href="${helpers.leagueUrl(["player", p.pid])}">${
                    p.firstName
                } ${
                    p.lastName
                }</a> was inducted into the <a href="${helpers.leagueUrl([
                    "hall_of_fame",
                ])}">Hall of Fame</a>.`,
                showNotification: p.statsTids.includes(g.userTid),
                pids: [p.pid],
                tids: p.statsTids,
            },
            conditions,
        );
    }
}

// See views.negotiation for moods as well
function moodColorText(p: Player) {
    if (p.freeAgentMood[g.userTid] < 0.25) {
        return {
            color: "#5cb85c",
            text: "Eager to reach an agreement.",
        };
    }

    if (p.freeAgentMood[g.userTid] < 0.5) {
        return {
            color: "#ccc",
            text: "Willing to sign for the right price.",
        };
    }

    if (p.freeAgentMood[g.userTid] < 0.75) {
        return {
            color: "#f0ad4e",
            text: "Annoyed at you.",
        };
    }

    return {
        color: "#d9534f",
        text: "Insulted by your presence.",
    };
}

function checkStatisticalFeat(
    pid: number,
    tid: number,
    p: GamePlayer,
    results: GameResults,
    conditions: Conditions,
) {
    const minFactor = Math.sqrt(g.quarterLength / 12); // sqrt is to account for fatigue in short/long games. Also https://news.ycombinator.com/item?id=11032596
    const TEN = minFactor * 10;
    const FIVE = minFactor * 5;
    const TWENTY = minFactor * 20;
    const TWENTY_FIVE = minFactor * 25;
    const FIFTY = minFactor * 50;

    let saveFeat = false;

    const logFeat = text => {
        logEvent(
            {
                type: "playerFeat",
                text,
                showNotification: tid === g.userTid,
                pids: [pid],
                tids: [tid],
            },
            conditions,
        );
    };

    let doubles = ["pts", "ast", "stl", "blk"].reduce((count, stat) => {
        if (p.stat[stat] >= TEN) {
            return count + 1;
        }
        return count;
    }, 0);
    if (p.stat.orb + p.stat.drb >= TEN) {
        doubles += 1;
    }

    const statArr = {};
    if (
        p.stat.pts >= FIVE &&
        p.stat.ast >= FIVE &&
        p.stat.stl >= FIVE &&
        p.stat.blk >= FIVE &&
        p.stat.orb + p.stat.drb >= FIVE
    ) {
        statArr.points = p.stat.pts;
        statArr.rebounds = p.stat.orb + p.stat.drb;
        statArr.assists = p.stat.ast;
        statArr.steals = p.stat.stl;
        statArr.blocks = p.stat.blk;
        saveFeat = true;
    }
    if (doubles >= 3) {
        if (p.stat.pts >= TEN) {
            statArr.points = p.stat.pts;
        }
        if (p.stat.orb + p.stat.drb >= TEN) {
            statArr.rebounds = p.stat.orb + p.stat.drb;
        }
        if (p.stat.ast >= TEN) {
            statArr.assists = p.stat.ast;
        }
        if (p.stat.stl >= TEN) {
            statArr.steals = p.stat.stl;
        }
        if (p.stat.blk >= TEN) {
            statArr.blocks = p.stat.blk;
        }
        saveFeat = true;
    }
    if (p.stat.pts >= FIFTY) {
        statArr.points = p.stat.pts;
        saveFeat = true;
    }
    if (p.stat.orb + p.stat.drb >= TWENTY_FIVE) {
        statArr.rebounds = p.stat.orb + p.stat.drb;
        saveFeat = true;
    }
    if (p.stat.ast >= TWENTY) {
        statArr.assists = p.stat.ast;
        saveFeat = true;
    }
    if (p.stat.stl >= TEN) {
        statArr.steals = p.stat.stl;
        saveFeat = true;
    }
    if (p.stat.blk >= TEN) {
        statArr.blocks = p.stat.blk;
        saveFeat = true;
    }
    if (p.stat.tp >= TEN) {
        statArr["three pointers"] = p.stat.tp;
        saveFeat = true;
    }

    if (saveFeat) {
        const [i, j] = results.team[0].id === tid ? [0, 1] : [1, 0];
        const won = results.team[i].stat.pts > results.team[j].stat.pts;
        const featTextArr = Object.keys(statArr).map(
            stat => `${statArr[stat]} ${stat}`,
        );

        let featText = `<a href="${helpers.leagueUrl(["player", pid])}">${
            p.name
        }</a> had <a href="${helpers.leagueUrl([
            "game_log",
            g.teamAbbrevsCache[tid],
            g.season,
            results.gid,
        ])}">`;
        for (let k = 0; k < featTextArr.length; k++) {
            if (featTextArr.length > 1 && k === featTextArr.length - 1) {
                featText += " and ";
            }

            featText += featTextArr[k];

            if (featTextArr.length > 2 && k < featTextArr.length - 2) {
                featText += ", ";
            }
        }
        featText += `</a> in ${
            results.team[i].stat.pts.toString().charAt(0) === "8" ? "an" : "a"
        } ${results.team[i].stat.pts}-${results.team[j].stat.pts} ${
            won ? "win over the" : "loss to the"
        } ${g.teamNamesCache[results.team[j].id]}.`;

        logFeat(featText);

        idb.cache.playerFeats.add({
            pid,
            name: p.name,
            pos: p.pos,
            season: g.season,
            tid,
            oppTid: results.team[j].id,
            playoffs: g.phase === PHASE.PLAYOFFS,
            gid: results.gid,
            stats: p.stat,
            won,
            score: `${results.team[i].stat.pts}-${results.team[j].stat.pts}`,
            overtimes: results.overtimes,
        });
    }
}

async function killOne(conditions: Conditions) {
    const reason = random.choice([
        "died from a drug overdose",
        "was killed by a gunshot during an altercation at a night club",
        "was eaten by wolves",
        "died in a car crash",
        "was stabbed to death by a jealous ex-girlfriend",
        "committed suicide",
        "died from a rapidly progressing case of ebola",
        "was killed in a bar fight",
        "died after falling out of his 13th floor hotel room",
        "was shredded to bits by the team plane's propeller",
        "was hit by a stray meteor",
        "accidentally shot himself in the head while cleaning his gun",
        "was beheaded by ISIS",
        "spontaneously combusted",
        "had a stroke after reading about the owner's plans to trade him",
        "laughed himself to death while watching Modern Family",
        "died of exertion while trying to set the record for largerst number of sex partners in one day",
        "rode his Segway off a cliff",
        "fell into the gorilla pit at the zoo and was dismembered as the staff decided not to shoot the gorilla",
        "was found dead in a hotel room with a belt around his neck and his hand around his dick",
        "was pursued by a bear, and mauled", // poor Antigonus
        "was smothered by a throng of ravenous, autograph-seeking fans after exiting the team plane",
        `was killed by ${random.choice([
            "Miss Scarlet",
            "Professor Plum",
            "Mrs. Peacock",
            "Reverend Green",
            "Colonel Mustard",
            "Mrs. White",
        ])}, in the ${random.choice([
            "kitchen",
            "ballroom",
            "conservatory",
            "dining room",
            "cellar",
            "billiard room",
            "library",
            "lounge",
            "hall",
            "study",
        ])}, with the ${random.choice([
            "candlestick",
            "dagger",
            "lead pipe",
            "revolver",
            "rope",
            "spanner",
        ])}`,
        "suffered a heart attack in the team training facility and died",
        "was lost at sea and is presumed dead",
        "was run over by a car",
        "was run over by a car, and then was run over by a second car. Police believe only the first was intentional",
        "cannot be found and is presumed dead. Neighbors reported strange lights in the sky above his house last night",
    ]);

    // Pick random team
    const tid = random.randInt(0, g.numTeams - 1);

    const players = await idb.cache.players.indexGetAll("playersByTid", tid);

    // Pick a random player on that team
    const p = random.choice(players);

    // Get player stats, used for HOF calculation
    const playerStats = await idb.getCopies.playerStats({ pid: p.pid });

    retire(p, playerStats, conditions, false);
    p.diedYear = g.season;

    await idb.cache.players.put(p);
    idb.cache.markDirtyIndexes("players");

    logEvent(
        {
            type: "tragedy",
            text: `<a href="${helpers.leagueUrl(["player", p.pid])}">${
                p.firstName
            } ${p.lastName}</a> ${reason}.`,
            showNotification: tid === g.userTid,
            pids: [p.pid],
            tids: [tid],
            persistent: true,
        },
        conditions,
    );
}

const getPlayerFakeAge = async (players: Player[]): Promise<Player | void> => {
    // This list is very arbitrary, but certain countries are deemed more likely to have a player with a fake age
    const highRiskCountries = [
        "Angola",
        "Belarus",
        "Benin",
        "Bulgaria",
        "Cameroon",
        "Cape Verde",
        "Central African Republic",
        "Chad",
        "China",
        "Congo",
        "Egypt",
        "Gabon",
        "Georgia",
        "Ghana",
        "Guinea",
        "Haiti",
        "Iran",
        "Ivory Coast",
        "Kazakhstan",
        "Kenya",
        "Mali",
        "Morocco",
        "Nigeria",
        "Senegal",
        "South Africa",
        "South Sudan",
        "Sudan",
        "Turkey",
        "Ukraine",
    ];

    // Only young players can have a fake age, and players from high risk countries have 40x risk
    const youngPlayers = players.filter(p => g.season - p.born.year <= 22);
    const weights = youngPlayers.map(p => {
        return highRiskCountries.includes(p.born.loc) ? 40 : 1;
    });

    const sum = weights.reduce((total, current) => current + total, 0);
    const randVal = random.randInt(0, sum - 1);

    let runningSum = 0;
    for (let i = 0; i < weights.length; i++) {
        runningSum += weights[i];
        if (randVal < runningSum) {
            return youngPlayers[i];
        }
    }
};

export default {
    addRatingsRow,
    addStatsRow,
    genBaseMoods,
    addToFreeAgents,
    genContract,
    setContract,
    bonus,
    develop,
    injury,
    generate,
    ovr,
    release,
    skills,
    madeHof,
    updateValues,
    retire,
    name,
    contractSeasonsRemaining,
    moodColorText,
    augmentPartialPlayer,
    checkStatisticalFeat,
    killOne,
    fuzzRating,
    getPlayerFakeAge,
    heightToRating,
    shouldRetire,

    // When fully modular, delete these exports cause they are only used by other player functions
    limitRating,
    pos,
};
