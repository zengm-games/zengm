// @flow

import countBy from "lodash/countBy";
import { PHASE } from "../../../common";
import { draft, player, trade } from "..";
import { idb } from "../../db";
import { g, helpers } from "../../util";
import type { TradePickValues } from "../../../common/types";
import getPayroll from "./getPayroll";

// estValuesCached is either a copy of estValues (defined below) or null. When it's cached, it's much faster for repeated calls (like trading block).
const valueChange = async (
    tid: number,
    pidsAdd: number[],
    pidsRemove: number[],
    dpidsAdd: number[],
    dpidsRemove: number[],
    estValuesCached?: TradePickValues,
): Promise<number> => {
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

    const payroll = await getPayroll(tid);

    const difficultyFudgeFactor = helpers.bound(
        1 + 0.1 * g.difficulty,
        0,
        Infinity,
    ); // 2.5% bonus for easy, 2.5% penalty for hard, 10% penalty for insane

    // Get players
    const getPlayers = async () => {
        // Fudge factor for AI overvaluing its own players
        const fudgeFactor =
            (tid !== g.userTid ? 1.05 : 1) * difficultyFudgeFactor;

        // Get roster and players to remove
        const players = await idb.cache.players.indexGetAll(
            "playersByTid",
            tid,
        );
        for (const p of players) {
            if (!pidsRemove.includes(p.pid)) {
                roster.push({
                    value: p.value,
                    skills: p.ratings[p.ratings.length - 1].skills,
                    contract: p.contract,
                    worth: player.genContract(p, false, false, true),
                    injury: p.injury,
                    age: g.season - p.born.year,
                });
            } else {
                remove.push({
                    value: p.value * fudgeFactor,
                    skills: p.ratings[p.ratings.length - 1].skills,
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
                skills: p.ratings[p.ratings.length - 1].skills,
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
                [[g.season - 1], [g.season, "Z"]],
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
                        ((gp / halfSeason) * rCurrent[0]) / gp +
                            (((halfSeason - gp) / halfSeason) * rLast[0]) /
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
                if (!dp) {
                    continue;
                }
                const season = dp.season === "fantasy" ? g.season : dp.season;
                let estPick;
                if (dp.pick > 0) {
                    estPick = dp.pick;
                } else {
                    estPick = estPicks[dp.originalTid];

                    // For future draft picks, add some uncertainty
                    const seasons = season - g.season;
                    estPick = Math.round(
                        (estPick * (5 - seasons)) / 5 + (15 * seasons) / 5,
                    );
                }

                // No fudge factor, since this is coming from the user's team (or eventually, another AI)
                let value;
                if (estValues[String(season)]) {
                    value =
                        estValues[String(season)][
                            estPick - 1 + g.numTeams * (dp.round - 1)
                        ];
                }
                if (value === undefined) {
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
                        exp: season + 2 + (2 - dp.round), // 3 for first round, 2 for second
                    },
                    worth: {
                        amount:
                            rookieSalaries[
                                estPick - 1 + g.numTeams * (dp.round - 1)
                            ],
                        exp: season + 2 + (2 - dp.round), // 3 for first round, 2 for second
                    },
                    injury: { type: "Healthy", gamesRemaining: 0 },
                    age: 19,
                    draftPick: true,
                });
            }

            for (const dpid of dpidsRemove) {
                const dp = await idb.cache.draftPicks.get(dpid);
                if (!dp) {
                    continue;
                }
                const season = dp.season === "fantasy" ? g.season : dp.season;
                const seasons = season - g.season;
                let estPick;
                if (dp.pick > 0) {
                    estPick = dp.pick;
                } else {
                    estPick = estPicks[dp.originalTid];

                    // For future draft picks, add some uncertainty
                    estPick = Math.round(
                        (estPick * (5 - seasons)) / 5 + (15 * seasons) / 5,
                    );
                }

                // Set fudge factor with more confidence if it's the current season
                let fudgeFactor;
                if (seasons === 0 && gp >= g.numGames / 2) {
                    fudgeFactor = (1 - gp / g.numGames) * 10;
                } else {
                    fudgeFactor = 10;
                }

                // Use fudge factor: AI teams like their own picks
                let value;
                if (estValues[String(season)]) {
                    value =
                        estValues[String(season)][
                            estPick - 1 + g.numTeams * (dp.round - 1)
                        ] +
                        (tid !== g.userTid ? 1 : 0) *
                            fudgeFactor *
                            difficultyFudgeFactor;
                }
                if (value === undefined) {
                    value =
                        estValues.default[
                            estPick - 1 + g.numTeams * (dp.round - 1)
                        ] +
                        (tid !== g.userTid ? 1 : 0) *
                            fudgeFactor *
                            difficultyFudgeFactor;
                }

                remove.push({
                    value,
                    skills: [],
                    contract: {
                        amount:
                            rookieSalaries[
                                estPick - 1 + g.numTeams * (dp.round - 1)
                            ] / 1000,
                        exp: season + 2 + (2 - dp.round), // 3 for first round, 2 for second
                    },
                    worth: {
                        amount:
                            rookieSalaries[
                                estPick - 1 + g.numTeams * (dp.round - 1)
                            ] / 1000,
                        exp: season + 2 + (2 - dp.round), // 3 for first round, 2 for second
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
                rosterSkills = rosterSkills.concat(rosterLocal[i].skills);
            }
        }
        const rosterSkillsCount = countBy(rosterSkills);

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
    if (process.env.SPORT === "basketball") {
        const rosterAndRemove = roster.concat(remove);
        const rosterAndAdd = roster.concat(add);
        add = doSkillBonuses(add, rosterAndRemove);
        remove = doSkillBonuses(remove, rosterAndAdd);
    }

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

            // After the player development changes in early 2018, player.value is in a more compressed range (linear starting from ~30 rather than 0), so nonlinearity needs to be introduced here to make things "feel" similar to before.
            playerValue -= 52;
            if (playerValue > 0) {
                playerValue **= 2;
            }

            // Normalize for injuries
            if (includeInjuries && tid !== g.userTid) {
                if (p.injury.gamesRemaining > 75) {
                    playerValue -= playerValue * 0.75;
                } else {
                    playerValue -=
                        (playerValue * p.injury.gamesRemaining) / 100;
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
            return memo + (Math.abs(value) ** base * Math.abs(value)) / value;
        }, 0);

        if (exponential === 0) {
            return exponential;
        }
        return (
            (Math.abs(exponential) ** (1 / base) * Math.abs(exponential)) /
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
                (p.contract.amount / 1000) *
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
                dv -= (0.2 + (0.8 * g.daysLeft) / 30) * salaryAddedThisSeason; // 0.2 to 1 times the amount, depending on stage of free agency
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
};

export default valueChange;
