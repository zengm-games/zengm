// @flow

import _ from "underscore";
import { PHASE, PLAYER, g, helpers } from "../../common";
import { draft, player, trade } from "../core";
import { idb } from "../db";
import { local, logEvent, random } from "../util";
import type {
    Conditions,
    ContractInfo,
    TeamSeason,
    TeamStats,
    TradePickValues,
} from "../../common/types";

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
        playoffRoundsWon: -1, // -1: didn't make playoffs. 0: lost in first round. ... N: won championship
        hype: Math.random(),
        pop: 0, // Needs to be set somewhere!
        revenues: {
            luxuryTaxShare: {
                amount: 0,
                rank: 15.5,
            },
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
        newSeason.pop = prevSeason.pop * random.uniform(0.98, 1.02); // Mean population should stay constant, otherwise the economics change too much
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
        ast: 0,
        tov: 0,
        stl: 0,
        blk: 0,
        pf: 0,
        pts: 0,
        oppFg: 0,
        oppFga: 0,
        oppFgAtRim: 0,
        oppFgaAtRim: 0,
        oppFgLowPost: 0,
        oppFgaLowPost: 0,
        oppFgMidRange: 0,
        oppFgaMidRange: 0,
        oppTp: 0,
        oppTpa: 0,
        oppFt: 0,
        oppFta: 0,
        oppOrb: 0,
        oppDrb: 0,
        oppAst: 0,
        oppTov: 0,
        oppStl: 0,
        oppBlk: 0,
        oppPf: 0,
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
                amount: tm.hasOwnProperty("budget")
                    ? tm.budget.ticketPrice.amount
                    : parseFloat(
                          (
                              g.salaryCap / 90000 * 37 +
                              25 * (g.numTeams - tm.popRank) / (g.numTeams - 1)
                          ).toFixed(2),
                      ),
                rank: tm.hasOwnProperty("budget")
                    ? tm.budget.ticketPrice.rank
                    : tm.popRank,
            },
            scouting: {
                amount: tm.hasOwnProperty("budget")
                    ? tm.budget.scouting.amount
                    : Math.round(
                          g.salaryCap / 90000 * 1350 +
                              900 *
                                  (g.numTeams - tm.popRank) /
                                  (g.numTeams - 1),
                      ) * 10,
                rank: tm.hasOwnProperty("budget")
                    ? tm.budget.scouting.rank
                    : tm.popRank,
            },
            coaching: {
                amount: tm.hasOwnProperty("budget")
                    ? tm.budget.coaching.amount
                    : Math.round(
                          g.salaryCap / 90000 * 1350 +
                              900 *
                                  (g.numTeams - tm.popRank) /
                                  (g.numTeams - 1),
                      ) * 10,
                rank: tm.hasOwnProperty("budget")
                    ? tm.budget.coaching.rank
                    : tm.popRank,
            },
            health: {
                amount: tm.hasOwnProperty("budget")
                    ? tm.budget.health.amount
                    : Math.round(
                          g.salaryCap / 90000 * 1350 +
                              900 *
                                  (g.numTeams - tm.popRank) /
                                  (g.numTeams - 1),
                      ) * 10,
                rank: tm.hasOwnProperty("budget")
                    ? tm.budget.health.rank
                    : tm.popRank,
            },
            facilities: {
                amount: tm.hasOwnProperty("budget")
                    ? tm.budget.facilities.amount
                    : Math.round(
                          g.salaryCap / 90000 * 1350 +
                              900 *
                                  (g.numTeams - tm.popRank) /
                                  (g.numTeams - 1),
                      ) * 10,
                rank: tm.hasOwnProperty("budget")
                    ? tm.budget.facilities.rank
                    : tm.popRank,
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
        if (starters.length === 5 || (numG >= 2 && numFC >= 2)) {
            break;
        }

        // Make sure we can get 2 G and 2 F/C
        if (
            5 - starters.length >
                (2 - numG > 0 ? 2 - numG : 0) +
                    (2 - numFC > 0 ? 2 - numFC : 0) ||
            (numG < 2 && positions[i].includes("G")) ||
            (numFC < 2 &&
                (positions[i].includes("F") ||
                    (positions[i] === "C" && numC === 0)))
        ) {
            starters.push(i);
            numG += positions[i].includes("G") ? 1 : 0;
            numFC += positions[i].includes("F") || positions[i] === "C" ? 1 : 0;
            numC += positions[i] === "C" ? 1 : 0;
        }
    }

    // Fill in after meeting requirements, but still not too many Cs!
    for (let i = 0; i < positions.length; i++) {
        if (starters.length === 5) {
            break;
        }
        if (starters.includes(i)) {
            continue;
        }
        if (numC >= 1 && positions[i] === "c") {
            continue;
        }

        starters.push(i);
        numC += positions[i] === "C" ? 1 : 0;
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
    const playersFromCache = await idb.cache.players.indexGetAll(
        "playersByTid",
        tid,
    );
    let players = helpers.deepCopy(playersFromCache);
    players = await idb.getCopies.playersPlus(players, {
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
        for (const p2 of players) {
            if (p2.pid === p.pid) {
                if (p.rosterOrder !== p2.rosterOrder) {
                    // Only write to DB if this actually changes
                    p.rosterOrder = p2.rosterOrder;
                    await idb.cache.players.put(p);
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
    const players = await idb.cache.players.indexGetAll("playersByTid", tid);

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
    const releasedPlayers = await idb.cache.releasedPlayers.indexGetAll(
        "releasedPlayersByTid",
        tid,
    );

    for (const releasedPlayer of releasedPlayers) {
        const p = await idb.getCopy.players({ pid: releasedPlayer.pid });
        if (p !== undefined) {
            // If a player is deleted, such as if the user deletes retired players, this will be undefined
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
                injury: { type: "Healthy", gamesRemaining: 0 },
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
        payroll += contracts[i].amount; // No need to check exp, since anyone without a contract for the current season will not have an entry
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
    return Promise.all(
        _.range(g.numTeams).map(async tid => {
            return (await getPayroll(tid))[0];
        }),
    );
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

    // Get team strategy and population, for future use
    const t = await idb.getCopy.teamsPlus({
        attrs: ["strategy"],
        seasonAttrs: ["pop"],
        stats: ["gp"],
        season: g.season,
        tid,
    });
    if (!t) {
        throw new Error("Invalid team ID");
    }

    const strategy = t.strategy;
    let pop = t.seasonAttrs.pop;
    if (pop > 20) {
        pop = 20;
    }
    const gpAvg = helpers.bound(t.stats.gp, 0, g.numGames); // Ideally would be done separately for each team, but close enough

    const payroll = (await getPayroll(tid))[0];

    // Get players
    const getPlayers = async () => {
        // Fudge factor for AI overvaluing its own players
        const fudgeFactor = tid !== g.userTid ? 1.05 : 1;

        // Get roster and players to remove
        const players = await idb.cache.players.indexGetAll(
            "playersByTid",
            tid,
        );
        for (const p of players) {
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
        for (const pid of pidsAdd) {
            const p = await idb.cache.players.get(pid);
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
            const allTeamSeasons = await idb.cache.teamSeasons.indexGetAll(
                "teamSeasonsBySeasonTid",
                [`${g.season - 1}`, `${g.season},Z`],
            );

            // This part needs to be run every time so that gpAvg is available
            const wps = []; // Contains estimated winning percentages for all teams by the end of the season

            let gp = 0;
            for (let tid2 = 0; tid2 < g.numTeams; tid2++) {
                const teamSeasons = allTeamSeasons.filter(
                    teamSeason => teamSeason.tid === tid2,
                );
                const s = teamSeasons.length;

                let rCurrent;
                let rLast;
                if (teamSeasons.length === 1) {
                    // First season
                    if (teamSeasons[0].won + teamSeasons[0].lost > 15) {
                        rCurrent = [teamSeasons[0].won, teamSeasons[0].lost];
                    } else {
                        // Fix for new leagues - don't base this on record until we have some games played, and don't let the user's picks be overvalued
                        rCurrent =
                            tid2 === g.userTid
                                ? [g.numGames, 0]
                                : [0, g.numGames];
                    }

                    if (tid2 === g.userTid) {
                        rLast = [
                            Math.round(0.6 * g.numGames),
                            Math.round(0.4 * g.numGames),
                        ];
                    } else {
                        // Assume a losing season to minimize bad trades
                        rLast = [
                            Math.round(0.4 * g.numGames),
                            Math.round(0.6 * g.numGames),
                        ];
                    }
                } else {
                    // Second (or higher) season
                    rCurrent = [
                        teamSeasons[s - 1].won,
                        teamSeasons[s - 1].lost,
                    ];
                    rLast = [teamSeasons[s - 2].won, teamSeasons[s - 2].lost];
                }

                gp = rCurrent[0] + rCurrent[1]; // Might not be "real" games played

                // If we've played half a season, just use that as an estimate. Otherwise, take a weighted sum of this and last year
                const halfSeason = Math.round(0.5 * g.numGames);
                if (gp >= halfSeason) {
                    wps.push(rCurrent[0] / gp);
                } else if (gp > 0) {
                    wps.push(
                        gp / halfSeason * rCurrent[0] / gp +
                            (halfSeason - gp) /
                                halfSeason *
                                rLast[0] /
                                g.numGames,
                    );
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
            if (estValuesCached) {
                estValues = estValuesCached;
            } else {
                estValues = await trade.getPickValues();
            }

            for (const dpid of dpidsAdd) {
                const dp = await idb.cache.draftPicks.get(dpid);

                let estPick = estPicks[dp.originalTid];

                // For future draft picks, add some uncertainty
                const seasons = dp.season - g.season;
                estPick = Math.round(
                    estPick * (5 - seasons) / 5 + 15 * seasons / 5,
                );

                // No fudge factor, since this is coming from the user's team (or eventually, another AI)
                let value;
                if (estValues[String(dp.season)]) {
                    value =
                        estValues[String(dp.season)][
                            estPick - 1 + g.numTeams * (dp.round - 1)
                        ];
                }
                if (!value) {
                    value =
                        estValues.default[
                            estPick - 1 + g.numTeams * (dp.round - 1)
                        ];
                }

                add.push({
                    value,
                    skills: [],
                    contract: {
                        amount:
                            rookieSalaries[
                                estPick - 1 + g.numTeams * (dp.round - 1)
                            ],
                        exp: dp.season + 2 + (2 - dp.round), // 3 for first round, 2 for second
                    },
                    worth: {
                        amount:
                            rookieSalaries[
                                estPick - 1 + g.numTeams * (dp.round - 1)
                            ],
                        exp: dp.season + 2 + (2 - dp.round), // 3 for first round, 2 for second
                    },
                    injury: { type: "Healthy", gamesRemaining: 0 },
                    age: 19,
                    draftPick: true,
                });
            }

            for (const dpid of dpidsRemove) {
                const dp = await idb.cache.draftPicks.get(dpid);
                let estPick = estPicks[dp.originalTid];

                // For future draft picks, add some uncertainty
                const seasons = dp.season - g.season;
                estPick = Math.round(
                    estPick * (5 - seasons) / 5 + 15 * seasons / 5,
                );

                // Set fudge factor with more confidence if it's the current season
                let fudgeFactor;
                if (seasons === 0 && gp >= g.numGames / 2) {
                    fudgeFactor = (1 - gp / g.numGames) * 5;
                } else {
                    fudgeFactor = 5;
                }

                // Use fudge factor: AI teams like their own picks
                let value;
                if (estValues[String(dp.season)]) {
                    value =
                        estValues[String(dp.season)][
                            estPick - 1 + g.numTeams * (dp.round - 1)
                        ] +
                        (tid !== g.userTid ? 1 : 0) * fudgeFactor;
                }
                if (!value) {
                    value =
                        estValues.default[
                            estPick - 1 + g.numTeams * (dp.round - 1)
                        ] +
                        (tid !== g.userTid ? 1 : 0) * fudgeFactor;
                }

                remove.push({
                    value,
                    skills: [],
                    contract: {
                        amount:
                            rookieSalaries[
                                estPick - 1 + g.numTeams * (dp.round - 1)
                            ] / 1000,
                        exp: dp.season + 2 + (2 - dp.round), // 3 for first round, 2 for second
                    },
                    worth: {
                        amount:
                            rookieSalaries[
                                estPick - 1 + g.numTeams * (dp.round - 1)
                            ] / 1000,
                        exp: dp.season + 2 + (2 - dp.round), // 3 for first round, 2 for second
                    },
                    injury: { type: "Healthy", gamesRemaining: 0 },
                    age: 19,
                    draftPick: true,
                });
            }
        }
    };

    await getPlayers();
    await getPicks();

    /*    // Handle situations where the team goes over the roster size limit
    if (roster.length + remove.length > g.maxRosterSize) {
        // Already over roster limit, so don't worry unless this trade actually makes it worse
        needToDrop = (roster.length + add.length) - (roster.length + remove.length);
    } else {
        needToDrop = (roster.length + add.length) - g.maxRosterSize;
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
        "3": 5,
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
        includeInjuries =
            includeInjuries !== undefined ? includeInjuries : false;

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
            const contractSeasonsRemaining = player.contractSeasonsRemaining(
                p.contract.exp,
                g.numGames - gpAvg,
            );
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
            return memo + Math.abs(value) ** base * Math.abs(value) / value;
        }, 0);

        if (exponential === 0) {
            return exponential;
        }
        return (
            Math.abs(exponential) ** (1 / base) *
            Math.abs(exponential) /
            exponential
        );
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

            return (
                memo +
                p.contract.amount /
                    1000 *
                    player.contractSeasonsRemaining(
                        p.contract.exp,
                        g.numGames - gpAvg,
                    ) **
                        (0.25 - (onlyThisSeason ? 0.25 : 0))
            );
        }, 0);
    };

    const contractsFactor = strategy === "rebuilding" ? 0.3 : 0.1;

    const salaryRemoved = sumContracts(remove) - sumContracts(add);

    let dv =
        sumValues(add, true) -
        sumValues(remove) +
        contractsFactor * salaryRemoved;
    /*console.log("Added players/picks: " + sumValues(add, true));
console.log("Removed players/picks: " + (-sumValues(remove)));
console.log("Added contract quality: -" + contractExcessFactor + " * " + sumContractExcess(add));
console.log("Removed contract quality: -" + contractExcessFactor + " * " + sumContractExcess(remove));
console.log("Total contract amount: " + contractsFactor + " * " + salaryRemoved);*/

    // Aversion towards losing cap space in a trade during free agency
    if (g.phase >= PHASE.RESIGN_PLAYERS || g.phase <= PHASE.FREE_AGENCY) {
        // Only care if cap space is over 2 million
        if (payroll + 2000 < g.salaryCap) {
            const salaryAddedThisSeason =
                sumContracts(add, true) - sumContracts(remove, true);
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
    const teams = await idb.cache.teams.getAll();
    for (const t of teams) {
        // Skip user's team
        if (t.tid === g.userTid) {
            continue;
        }

        // Change in wins
        const teamSeason = await idb.cache.teamSeasons.indexGet(
            "teamSeasonsBySeasonTid",
            `${g.season},${t.tid}`,
        );
        const teamSeasonOld = await idb.cache.teamSeasons.indexGet(
            "teamSeasonsBySeasonTid",
            `${g.season - 1},${t.tid}`,
        );

        const won = teamSeason.won;
        const dWon = teamSeasonOld ? won - teamSeasonOld.won : 0;

        // Young stars
        let players = await idb.cache.players.indexGetAll(
            "playersByTid",
            t.tid,
        );
        players = await idb.getCopies.playersPlus(players, {
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
            if (
                players[i].value > 65 &&
                players[i].contract.exp === g.season + 1 &&
                players[i].contract.amount <= 5 &&
                players[i].age <= 25
            ) {
                youngStar += 1;
            }
        }

        const age = numerator / denominator; // Average age, weighted by minutes played
        const score =
            0.8 * dWon +
            (won - g.numGames / 2) +
            5 * (26 - age) +
            youngStar * 20;

        let updated = false;
        if (score > 20 && t.strategy === "rebuilding") {
            t.strategy = "contending";
            updated = true;
        } else if (score < -20 && t.strategy === "contending") {
            t.strategy = "rebuilding";
            updated = true;
        }

        if (updated) {
            await idb.cache.teams.put(t);
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
async function checkRosterSizes(
    conditions: Conditions,
): Promise<string | void> {
    const minFreeAgents = [];
    let userTeamSizeError;

    const checkRosterSize = async tid => {
        const players = await idb.cache.players.indexGetAll(
            "playersByTid",
            tid,
        );
        let numPlayersOnRoster = players.length;
        if (numPlayersOnRoster > g.maxRosterSize) {
            if (g.userTids.includes(tid) && local.autoPlaySeasons === 0) {
                if (g.userTids.length <= 1) {
                    userTeamSizeError = "Your team has ";
                } else {
                    userTeamSizeError = `The ${g.teamRegionsCache[tid]} ${
                        g.teamNamesCache[tid]
                    } have `;
                }
                userTeamSizeError += `more than the maximum number of players (${
                    g.maxRosterSize
                }). You must remove players (by <a href="${helpers.leagueUrl([
                    "roster",
                ])}">releasing them from your roster</a> or through <a href="${helpers.leagueUrl(
                    ["trade"],
                )}">trades</a>) before continuing.`;
            } else {
                // Automatically drop lowest value players until we reach g.maxRosterSize
                players.sort((a, b) => a.value - b.value); // Lowest first
                const promises = [];
                for (let i = 0; i < numPlayersOnRoster - g.maxRosterSize; i++) {
                    promises.push(player.release(players[i], false));
                }
                await Promise.all(promises);
            }
        } else if (numPlayersOnRoster < g.minRosterSize) {
            if (g.userTids.includes(tid) && local.autoPlaySeasons === 0) {
                if (g.userTids.length <= 1) {
                    userTeamSizeError = "Your team has ";
                } else {
                    userTeamSizeError = `The ${g.teamRegionsCache[tid]} ${
                        g.teamNamesCache[tid]
                    } have `;
                }
                userTeamSizeError += `less than the minimum number of players (${
                    g.minRosterSize
                }). You must add players (through <a href="${helpers.leagueUrl([
                    "free_agents",
                ])}">free agency</a> or <a href="${helpers.leagueUrl([
                    "trade",
                ])}">trades</a>) before continuing.<br><br>Reminder: you can always sign free agents to ${helpers.formatCurrency(
                    g.minContract / 1000,
                    "M",
                    2,
                )}/yr contracts, even if you're over the cap!`;
            } else {
                // Auto-add players
                while (numPlayersOnRoster < g.minRosterSize) {
                    // See also core.phase
                    const p = minFreeAgents.shift();
                    if (!p) {
                        userTeamSizeError = `AI team ${
                            g.teamAbbrevsCache[tid]
                        } needs to add a player to meet the minimum roster requirements, but there are not enough free agents asking for a minimum salary. Easiest way to fix this is God Mode, give them extra players.`;
                        break;
                    }
                    p.tid = tid;
                    await player.addStatsRow(p, g.phase === PHASE.PLAYOFFS);
                    player.setContract(p, p.contract, true);
                    p.gamesUntilTradable = 15;
                    idb.cache.markDirtyIndexes("players");

                    logEvent(
                        {
                            type: "freeAgent",
                            text: `The <a href="${helpers.leagueUrl([
                                "roster",
                                g.teamAbbrevsCache[p.tid],
                                g.season,
                            ])}">${
                                g.teamNamesCache[p.tid]
                            }</a> signed <a href="${helpers.leagueUrl([
                                "player",
                                p.pid,
                            ])}">${p.firstName} ${
                                p.lastName
                            }</a> for ${helpers.formatCurrency(
                                p.contract.amount / 1000,
                                "M",
                            )}/year through ${p.contract.exp}.`,
                            showNotification: false,
                            pids: [p.pid],
                            tids: [p.tid],
                        },
                        conditions,
                    );

                    await idb.cache.players.put(p);

                    numPlayersOnRoster += 1;
                }
            }
        }

        // Auto sort rosters (except player's team)
        // This will sort all AI rosters before every game. Excessive? It could change some times, but usually it won't
        if (!g.userTids.includes(tid) || local.autoPlaySeasons > 0) {
            return rosterAutoSort(tid);
        }
    };

    const players = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.FREE_AGENT,
    );

    // List of free agents looking for minimum contracts, sorted by value. This is used to bump teams up to the minimum roster size.
    for (let i = 0; i < players.length; i++) {
        if (players[i].contract.amount === g.minContract) {
            minFreeAgents.push(players[i]);
        }
    }
    minFreeAgents.sort((a, b) => b.value - a.value);

    // Make sure teams are all within the roster limits
    for (let i = 0; i < g.numTeams; i++) {
        await checkRosterSize(i);
        if (userTeamSizeError) {
            break;
        }
    }

    return userTeamSizeError;
}

export default {
    genSeasonRow,
    genStatsRow,
    generate,
    findStarters,
    rosterAutoSort,
    valueChange,
    updateStrategies,
    checkRosterSizes,
    getPayroll,
    getPayrolls,
};
