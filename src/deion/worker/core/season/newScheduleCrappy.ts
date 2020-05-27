import { random, g } from "../../util";

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

const absSum = (nums: Record<number, number>) => {
	let sum = 0;
	for (const num of Object.values(nums)) {
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
const newScheduleCrappy = (
	teams: {
		tid: number;
	}[],
) => {
	const tids = teams.map(t => t.tid);
	random.shuffle(tids);

	// Number of games left to reschedule for each team
	const numRemaining: Record<number, number> = {};

	for (const tid of tids) {
		numRemaining[tid] = g.get("numGames");
	}

	let numWithRemaining = tids.length; // Number of teams with numRemaining > 0

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
	const balance: Record<number, number> = {};
	for (const matchup of matchups) {
		if (balance[matchup[0]] === undefined) {
			balance[matchup[0]] = 0;
		}
		if (balance[matchup[1]] === undefined) {
			balance[matchup[1]] = 0;
		}
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

export default newScheduleCrappy;
