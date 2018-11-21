// @flow

import flatten from "lodash/flatten";
import range from "lodash/range";
import { g, random } from "../../../../deion/worker/util";
import type { Team } from "../../../../deion/common/types";

/**
 * Creates a new regular season schedule for 30 teams.
 *
 * This makes an NBA-like schedule in terms of conference matchups, division matchups, and home/away games.
 *
 * @memberOf core.season
 * @return {Array.<Array.<number>>} All the season's games. Each element in the array is an array of the home team ID and the away team ID, respectively.
 */
const newScheduleDefault = (teams): [number, number][] => {
    const tids = []; // tid_home, tid_away

    // Collect info needed for scheduling
    const homeGames = [];
    const awayGames = [];
    for (let i = 0; i < teams.length; i++) {
        homeGames[i] = 0;
        awayGames[i] = 0;
    }
    for (let i = 0; i < teams.length; i++) {
        for (let j = 0; j < teams.length; j++) {
            if (teams[i].tid !== teams[j].tid) {
                const game = [teams[i].tid, teams[j].tid];

                // Constraint: 1 home game vs. each team in other conference
                if (teams[i].cid !== teams[j].cid) {
                    tids.push(game);
                    homeGames[i] += 1;
                    awayGames[j] += 1;
                }

                // Constraint: 2 home games vs. each team in same division
                if (teams[i].did === teams[j].did) {
                    tids.push(game);
                    tids.push(game);
                    homeGames[i] += 2;
                    awayGames[j] += 2;
                }

                // Constraint: 1-2 home games vs. each team in same conference and different division
                // Only do 1 now
                if (
                    teams[i].cid === teams[j].cid &&
                    teams[i].did !== teams[j].did
                ) {
                    tids.push(game);
                    homeGames[i] += 1;
                    awayGames[j] += 1;
                }
            }
        }
    }

    // Constraint: 1-2 home games vs. each team in same conference and different division
    // Constraint: We need 8 more of these games per home team!
    const tidsByConf = [[], []];
    const dids = [[], []];
    for (let i = 0; i < teams.length; i++) {
        tidsByConf[teams[i].cid].push(i);
        dids[teams[i].cid].push(teams[i].did);
    }

    for (let cid = 0; cid < g.confs.length; cid++) {
        const matchups = [];
        matchups.push([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
        let games = 0;
        while (games < 8) {
            let newMatchup = [];
            let n = 0;
            while (n <= 14) {
                // 14 = num teams in conference - 1
                let iters = 0;
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const tryNum = random.randInt(0, 14);
                    // Pick tryNum such that it is in a different division than n and has not been picked before
                    if (
                        dids[cid][tryNum] !== dids[cid][n] &&
                        !newMatchup.includes(tryNum)
                    ) {
                        let good = true;
                        // Check for duplicate games
                        for (let j = 0; j < matchups.length; j++) {
                            const matchup = matchups[j];
                            if (matchup[n] === tryNum) {
                                good = false;
                                break;
                            }
                        }
                        if (good) {
                            newMatchup.push(tryNum);
                            break;
                        }
                    }
                    iters += 1;
                    // Sometimes this gets stuck (for example, first 14 teams in fine but 15th team must play itself)
                    // So, catch these situations and reset the newMatchup
                    if (iters > 50) {
                        newMatchup = [];
                        n = -1;
                        break;
                    }
                }
                n += 1;
            }
            matchups.push(newMatchup);
            games += 1;
        }
        matchups.shift(); // Remove the first row in matchups
        for (let j = 0; j < matchups.length; j++) {
            const matchup = matchups[j];
            for (let k = 0; k < matchup.length; k++) {
                const t = matchup[k];
                const ii = tidsByConf[cid][t];
                const jj = tidsByConf[cid][matchup[t]];
                const game = [teams[ii].tid, teams[jj].tid];
                tids.push(game);
                homeGames[ii] += 1;
                awayGames[jj] += 1;
            }
        }
    }

    return tids;
};

// Takes all teams and returns all unique matchups between teams. This means 2 games per matchup, to deal with
// home/away. See https://en.wikipedia.org/wiki/Round-robin_tournament#Scheduling_algorithm
const roundRobin = (tidsInput: number[]): [number, number][] => {
    // $FlowFixMe
    const tids: (number | "DUMMY")[] = tidsInput.slice();
    if (tids.length % 2 === 1) {
        tids.push("DUMMY");
    }

    const matchups = [];

    // Take teams from first half (i) and second half (j)
    for (let j = 0; j < tids.length - 1; j += 1) {
        for (let i = 0; i < tids.length / 2; i += 1) {
            const tid0 = tids[i];
            const tid1 = tids[tids.length - 1 - i];
            if (tid0 !== "DUMMY" && tid1 !== "DUMMY") {
                matchups.push([tid0, tid1]);
            }
        }

        // Permute tids for next round - take the last one and move it up to 2nd, leaving 1st in place
        tids.splice(1, 0, tids.pop());
    }

    return matchups;
};

/**
 * Creates a new regular season schedule for an arbitrary number of teams.
 *
 * newScheduleDefault is much nicer and more balanced, but only works for 30 teams and 82 games.
 *
 * @memberOf core.season
 * @return {Array.<Array.<number>>} All the season's games. Each element in the array is an array of the home team ID and the away team ID, respectively.
 */
export const newScheduleCrappy = (): [number, number][] => {
    const tids = range(g.numTeams);
    random.shuffle(tids);

    // Number of games left to reschedule for each team
    const numRemaining = [];
    for (let i = 0; i < g.numTeams; i++) {
        numRemaining[i] = g.numGames;
    }
    let numWithRemaining = g.numTeams; // Number of teams with numRemaining > 0

    const matchups = [];

    // 1 not 0, because if numTeams*numGames is odd, somebody will be left a game short
    const potentialMatchups = roundRobin(tids);
    while (numWithRemaining > 1) {
        for (const matchup of potentialMatchups) {
            const [i, j] = matchup;
            if (numRemaining[i] > 0 && numRemaining[j] > 0) {
                numRemaining[i] -= 1;
                numRemaining[j] -= 1;
                if (numRemaining[i] === 0) {
                    numWithRemaining -= 1;
                }
                if (numRemaining[j] === 0) {
                    numWithRemaining -= 1;
                }

                // Randomize which team is home or away. This is done because otherwise the first team could have all home games if numGames > numTeams
                if (Math.random() > 0.5) {
                    matchups.push(matchup);
                } else {
                    matchups.push([matchup[1], matchup[0]]);
                }
            }
        }
    }

    return matchups;
};

/**
 * Wrapper function to generate a new schedule with the appropriate algorithm based on the number of teams in the league.
 *
 * For leagues with NBA-like structure, use newScheduleDefault. Otherwise, newScheduleCrappy.
 *
 * @memberOf core.season
 * @return {Array.<Array.<number>>} All the season's games. Each element in the array is an array of the home team ID and the away team ID, respectively.
 */
const newSchedule = (teams: Team[]): [number, number][] => {
    let tids;
    let threeDivsPerConf = true;
    for (const conf of g.confs) {
        if (g.divs.filter(div => div.cid === conf.cid).length !== 3) {
            threeDivsPerConf = false;
            break;
        }
    }
    let twoConfsEvenTeams = g.confs.length === 2;
    for (const conf of g.confs) {
        if (teams.filter(t => t.cid === conf.cid).length !== teams.length / 2) {
            twoConfsEvenTeams = false;
            break;
        }
    }
    if (
        g.numTeams === 30 &&
        g.numGames === 82 &&
        g.confs.length === 2 &&
        threeDivsPerConf &&
        twoConfsEvenTeams
    ) {
        tids = newScheduleDefault(teams);
    } else {
        tids = newScheduleCrappy();
    }

    // Order the schedule so that it takes fewer days to play
    random.shuffle(tids);
    const days = [[]];
    const tidsInDays = [[]];
    let jMax = 0;
    for (let i = 0; i < tids.length; i++) {
        let used = false;
        for (let j = 0; j <= jMax; j++) {
            if (
                !tidsInDays[j].includes(tids[i][0]) &&
                !tidsInDays[j].includes(tids[i][1])
            ) {
                tidsInDays[j].push(tids[i][0]);
                tidsInDays[j].push(tids[i][1]);
                days[j].push(tids[i]);
                used = true;
                break;
            }
        }
        if (!used) {
            days.push([tids[i]]);
            tidsInDays.push([tids[i][0], tids[i][1]]);
            jMax += 1;
        }
    }
    random.shuffle(days); // Otherwise the most dense days will be at the beginning and the least dense days will be at the end
    tids = flatten(days);

    return tids;
};

export default newSchedule;
