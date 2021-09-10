import { orderBy } from "lodash";
import type { AllStars, DunkAttempt } from "../../../common/types";
import { idb } from "../../db";
import { g, random } from "../../util";
import dunkInfos from "./dunkInfos";

const LOWEST_POSSIBLE_SCORE = 30;
const NUM_ATTEMPTS_PER_DUNK = 3;
export const NUM_DUNKERS_IN_CONTEST = 4;
const NUM_DUNKS_PER_ROUND = 2;
const NUM_DUNKS_PER_TIEBREAKER = 1;

type Dunk = Exclude<AllStars["dunk"], undefined>;

const genDunk = () => {
	const dunk = {
		toss: random.choice(Object.keys(dunkInfos.toss)),
		distance: random.choice(Object.keys(dunkInfos.distance)),
		move1: random.choice(Object.keys(dunkInfos.move)),
		move2: random.choice(Object.keys(dunkInfos.move)),
	};

	return dunk;
};

export const getRoundResults = (round: Dunk["rounds"][number]) => {
	console.log("round", round);
	const resultsByIndex: Record<
		number,
		{
			index: number;
			numDunks: number;
			score: number;
		}
	> = {};

	for (const index of round.dunkers) {
		resultsByIndex[index] = {
			index,
			numDunks: 0,
			score: 0,
		};
	}

	for (const dunk of round.dunks) {
		if (dunk.score !== undefined) {
			resultsByIndex[dunk.index].numDunks += 1;
			resultsByIndex[dunk.index].score += dunk.score;
		}
	}

	return Object.values(resultsByIndex);
};

// Return undefined means contest is over or another round needs to be added
const getNextDunkerIndex = (dunk: Dunk) => {
	const currentRound = dunk.rounds.at(-1);

	// Another attempt at previous dunk needed
	const lastDunk = currentRound.dunks.at(-1);
	if (lastDunk !== undefined && lastDunk.score === undefined) {
		return lastDunk.index;
	}

	const numDunksPerPlayer = currentRound.tiebreaker
		? NUM_DUNKS_PER_TIEBREAKER
		: NUM_DUNKS_PER_ROUND;

	const numDunkersThisRound = currentRound.dunkers.length;

	// Round is over
	if (currentRound.dunks.length >= numDunkersThisRound * numDunksPerPlayer) {
		return undefined;
	}

	// Next dunker up
	return currentRound.dunkers[currentRound.dunks.length % numDunkersThisRound];
};

const getDunkOutcome = async (
	pid: number,
	dunkAttempt: DunkAttempt,
	numPriorAttempts: number,
) => {
	return Math.random() < 0.5;
};

const getDunkScore = (dunkAttempt: DunkAttempt) => {
	return random.randInt(30, 50);
};

export const simNextDunkAttempt = async () => {
	const allStars = await idb.cache.allStars.get(g.get("season"));
	const dunk = allStars?.dunk;
	if (!dunk) {
		throw new Error("No dunk contest found");
	}

	if (dunk.winner !== undefined) {
		// Already over
		return;
	}

	// Figure out current dunker
	const nextDunkerIndex = getNextDunkerIndex(dunk);
	if (nextDunkerIndex === undefined) {
		throw new Error("nextDunkerIndex should not be undefined");
		// ...because it's called again at the end of this function, and undefineds are handled there
	}

	const dunkToAttempt = genDunk();

	let stillSamePlayersTurn = true;

	const currentRound = dunk.rounds.at(-1);
	let lastDunk = currentRound.dunks.at(-1);
	if (lastDunk?.index !== nextDunkerIndex) {
		// New dunker!
		lastDunk = {
			index: nextDunkerIndex,
			attempts: [],
		};
		currentRound.dunks.push(lastDunk);
	}

	const success = await getDunkOutcome(
		dunk.players[nextDunkerIndex].pid,
		dunkToAttempt,
		lastDunk.attempts.length,
	);
	lastDunk.attempts.push(dunkToAttempt);
	if (success) {
		lastDunk.score = getDunkScore(dunkToAttempt);
		stillSamePlayersTurn = false;
	} else if (lastDunk.attempts.length >= NUM_ATTEMPTS_PER_DUNK) {
		lastDunk.score = LOWEST_POSSIBLE_SCORE;
		stillSamePlayersTurn = false;
	}

	// Contest over? Need to add another round?
	if (!stillSamePlayersTurn) {
		const index = getNextDunkerIndex(dunk);
		if (index === undefined) {
			// Index undefined means a round just ended. Do we need another normal round? Another tiebreaker round? Or is the contest over?

			const baseRounds = dunk.rounds.filter(round => !round.tiebreaker);

			// 1 or 2, depending on if we're in the 1st round (or its tiebreakers) or 2nd round (or its tiebreakers)
			const currentRoundNum = baseRounds.length;

			// Index of the current baseRound
			const currentRoundIndex = dunk.rounds.indexOf(baseRounds.at(-1));

			// Current round (1st or 2nd round) plus all its tiebreakers
			const currentRoundAndTiebreakers = dunk.rounds.filter(
				(round, i) => i >= currentRoundIndex,
			);

			const resultsByRound = currentRoundAndTiebreakers.map(round =>
				orderBy(getRoundResults(round), "score", "desc"),
			);

			let numWinnersLeftToFind = currentRoundNum === 1 ? 2 : 1;
			const indexesForNextRound: number[] = [];
			let indexesForNextTiebreaker: number[] = [];

			let outcome: "normalRound" | "over" | "tiebreakerRound" | undefined;

			for (const round of resultsByRound) {
				// Do the top N separate from the rest, as we need?
				if (
					round[numWinnersLeftToFind - 1].score >
					round[numWinnersLeftToFind].score
				) {
					for (let i = 0; i < numWinnersLeftToFind; i++) {
						indexesForNextRound.push(round[i].index);
					}
					numWinnersLeftToFind = 0;
					outcome = currentRoundNum === 1 ? "normalRound" : "over";
					break;
				} else {
					if (round[0].score > round[1].score) {
						// Well at least 1 does, then can use tiebreaker for the rest
						numWinnersLeftToFind -= 1;
						indexesForNextRound.push(round[0].index);
					}

					const tied = round.filter(p => p.score === round[1].score);
					indexesForNextTiebreaker = tied.map(p => p.index);

					outcome = "tiebreakerRound";
				}

				// Keep running if it still needs a tiebreaker, in case there already is another one
			}

			if (!outcome) {
				throw new Error("outcome should never be undefined");
			}

			if (outcome === "normalRound") {
				dunk.rounds.push({
					dunkers: indexesForNextRound,
					dunks: [],
				});
			} else if (outcome === "tiebreakerRound") {
				dunk.rounds.push({
					dunkers: indexesForNextTiebreaker,
					dunks: [],
					tiebreaker: true,
				});
			} else {
				dunk.winner = indexesForNextRound[0];
			}
		}
	}

	await idb.cache.allStars.put(allStars);
};
