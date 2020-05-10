import flatten from "lodash/flatten";
import range from "lodash/range";
import { g, random } from "../../../../deion/worker/util";

/**
 * Creates a new regular season schedule for 30 teams.
 *
 * This makes an NBA-like schedule in terms of conference matchups, division matchups, and home/away games.
 *
 * @memberOf core.season
 * @return {Array.<Array.<number>>} All the season's games. Each element in the array is an array of the home team ID and the away team ID, respectively.
 */
const newScheduleDefault = (
	teams: {
		seasonAttrs: {
			did: number;
		};
		tid: number;
	}[],
) => {
	const tids: [number, number][] = []; // tid_home, tid_away
	// Collect info needed for scheduling

	const homeGames: number[] = [];
	const awayGames: number[] = [];

	for (let i = 0; i < teams.length; i++) {
		homeGames[i] = 0;
		awayGames[i] = 0;
	}

	for (const t of teams) {
		for (const t2 of teams) {
			if (t.tid !== t2.tid) {
				// Constraint: 1 home game vs. each team in same division
				const game: [number, number] = [t.tid, t2.tid];

				if (t.seasonAttrs.did === t2.seasonAttrs.did) {
					tids.push(game);
					homeGames[t.tid] += 1;
					awayGames[t2.tid] += 1;
				}
			}
		}
	}

	// Constraint: 5 home games vs. teams from other divisions
	let failures = 0;

	while (true) {
		const newTids: [number, number][] = [];
		let success = true; // Copy, so each iteration of the while loop this is reset

		const homeGames2 = homeGames.slice();
		const awayGames2 = awayGames.slice();

		for (const t of teams) {
			const nonDivisionTeams = teams.filter(
				t2 => t.seasonAttrs.did !== t2.seasonAttrs.did,
			);
			const withGamesLeft = nonDivisionTeams.filter(
				t2 => awayGames2[t2.tid] < 8,
			);

			if (withGamesLeft.length < 5) {
				success = false;
				break;
			}

			random.shuffle(withGamesLeft);

			for (let i = 0; i < 5; i++) {
				const t2 = withGamesLeft[i];
				newTids.push([t.tid, t2.tid]);
				homeGames2[t.tid] += 1;
				awayGames2[t2.tid] += 1;
			}
		}

		if (success) {
			tids.push(...newTids);
			break;
		}

		failures += 1;

		if (failures > 100000) {
			throw new Error("Failed generating scheudle");
		}
	}

	return tids;
};

// Takes all teams and returns all unique matchups between teams. This means 2 games per matchup, to deal with
// home/away. See https://en.wikipedia.org/wiki/Round-robin_tournament#Scheduling_algorithm
const roundRobin = (tidsInput: number[]) => {
	const tids: (number | "DUMMY")[] = tidsInput.slice();

	if (tids.length % 2 === 1) {
		tids.push("DUMMY");
	}

	const matchups: [number, number][] = []; // Take teams from first half (i) and second half (j)

	for (let j = 0; j < tids.length - 1; j += 1) {
		for (let i = 0; i < tids.length / 2; i += 1) {
			const tid0 = tids[i];
			const tid1 = tids[tids.length - 1 - i];

			if (tid0 !== "DUMMY" && tid1 !== "DUMMY") {
				matchups.push([tid0, tid1]);
			}
		}

		// Permute tids for next round - take the last one and move it up to 2nd, leaving 1st in place
		// @ts-ignore
		tids.splice(1, 0, tids.pop());
	}

	return matchups;
};

const absSum = (nums: number[]) => {
	let sum = 0;
	for (const num of nums) {
		sum += Math.abs(num);
	}
	return sum;
};

/**
 * Creates a new regular season schedule for an arbitrary number of teams.
 *
 * newScheduleDefault is much nicer and more balanced, but only works for 30 teams and 82 games.
 *
 * @memberOf core.season
 * @return {Array.<Array.<number>>} All the season's games. Each element in the array is an array of the home team ID and the away team ID, respectively.
 */
export const newScheduleCrappy = () => {
	const tids = range(g.get("numTeams"));
	random.shuffle(tids);

	// Number of games left to reschedule for each team
	const numRemaining: number[] = [];

	for (let i = 0; i < g.get("numTeams"); i++) {
		numRemaining[i] = g.get("numGames");
	}

	let numWithRemaining = g.get("numTeams"); // Number of teams with numRemaining > 0

	const matchups: [number, number][] = [];

	const potentialMatchups = roundRobin(tids);

	// 1 not 0, because if numTeams*numGames is odd, somebody will be left a game short
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

				// Needed because below mutates
				matchups.push([matchup[0], matchup[1]]);
			}
		}
	}

	// Try to equalize home and away

	// How many home/away games for each team currently?
	const balance = Array(tids.length).fill(0);
	for (const matchup of matchups) {
		balance[matchup[0]] += 1;
		balance[matchup[1]] -= 1;
	}

	let iterations = 0;
	while (absSum(balance) !== 0 && iterations < 100) {
		for (const matchup of matchups) {
			// Add some randomness, to prevent it getting stuck swapping everything
			if (Math.random() > 0.5) {
				continue;
			}

			// Swap matchup if it brings the team that is currently furthest from balance closer to balanced
			const furthestFromEven =
				Math.abs(balance[matchup[0]]) > Math.abs(balance[matchup[1]]) ? 0 : 1;
			if (
				(balance[matchup[furthestFromEven]] > 0 && furthestFromEven === 0) ||
				(balance[matchup[furthestFromEven]] < 0 && furthestFromEven === 1)
			) {
				matchup.reverse();

				// 2 because we take away one home game and add one away game, or vice versa
				balance[matchup[0]] += 2;
				balance[matchup[1]] -= 2;
			}
		}

		iterations += 1;
	}

	return matchups;
};

/**
 * Wrapper function to generate a new schedule with the appropriate algorithm based on the number of teams in the league.
 *
 * For leagues with NFL-like structure, use newScheduleDefault. Otherwise, newScheduleCrappy.
 *
 * @memberOf core.season
 * @return {Array.<Array.<number>>} All the season's games. Each element in the array is an array of the home team ID and the away team ID, respectively.
 */
const newSchedule = (
	teams: {
		seasonAttrs: {
			cid: number;
			did: number;
		};
		tid: number;
	}[],
) => {
	let tids: [number, number][];
	let fourDivsPerConf = true;

	for (const conf of g.get("confs")) {
		if (g.get("divs").filter(div => div.cid === conf.cid).length !== 4) {
			fourDivsPerConf = false;
			break;
		}
	}

	let twoConfsEvenTeams = g.get("confs").length === 2;

	for (const conf of g.get("confs")) {
		if (
			teams.filter(t => t.seasonAttrs.cid === conf.cid).length !==
			teams.length / 2
		) {
			twoConfsEvenTeams = false;
			break;
		}
	}

	if (
		g.get("numTeams") === 32 &&
		g.get("numGames") === 16 &&
		g.get("confs").length === 2 &&
		fourDivsPerConf &&
		twoConfsEvenTeams
	) {
		tids = newScheduleDefault(teams);
	} else {
		tids = newScheduleCrappy();
	}

	// Order the schedule so that it takes fewer days to play
	random.shuffle(tids);
	const days: [number, number][][] = [[]];
	const tidsInDays: number[][] = [[]];
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
