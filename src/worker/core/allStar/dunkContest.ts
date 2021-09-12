import { orderBy } from "lodash";
import type { AllStars, Conditions, DunkAttempt } from "../../../common/types";
import { dunkInfos } from "../../../common";
import { idb } from "../../db";
import { g, helpers, random } from "../../util";
import { saveAwardsByPlayer } from "../season/awards";
import type { PlayerRatings } from "../../../common/types.basketball";

const HIGHEST_POSSIBLE_SCORE = 50;
const LOWEST_POSSIBLE_SCORE = 30;
const NUM_ATTEMPTS_PER_DUNK = 3;
export const NUM_DUNKERS_IN_CONTEST = 4;
const NUM_DUNKS_PER_ROUND = 2;
const NUM_DUNKS_PER_TIEBREAKER = 1;
const MAX_SCORE_DIFFICULTY = 8; // Dunk with this difficulty should get a perfect score

type Dunk = NonNullable<AllStars["dunk"]>;

type PreDunkInfo = {
	jmp: number;
	dnk: number;
	numPriorAttempts: number;
	priorAttempt: DunkAttempt | undefined;
	minScoreNeeded: number | undefined;
};

type DunkPart = "toss" | "distance" | "move1" | "move2";

const getValidMoves = (otherMove: string) => {
	const move1 = dunkInfos.move[otherMove];

	const validMoves = {
		...dunkInfos.move,
	};
	delete validMoves[otherMove];
	if (move1.group !== undefined) {
		for (const move of Object.keys(validMoves)) {
			if (validMoves[move].group === move1.group) {
				delete validMoves[move];
			}
		}
	}
	return validMoves;
};

const getDifficulty = (dunkAttempt: DunkAttempt) =>
	dunkInfos.toss[dunkAttempt.toss].difficulty +
	dunkInfos.distance[dunkAttempt.distance].difficulty +
	dunkInfos.move[dunkAttempt.move1].difficulty +
	dunkInfos.move[dunkAttempt.move2].difficulty;

// 8 is a 55, meaning even with randomness an 8 is always a 50
const difficultyToScore = (difficulty: number) =>
	30 + (difficulty * 25) / MAX_SCORE_DIFFICULTY;
const scoreToDifficulty = (score: number) =>
	((score - 30) * MAX_SCORE_DIFFICULTY) / 25;

const getDunkScoreRaw = (dunkAttempt: DunkAttempt) => {
	const difficulty = getDifficulty(dunkAttempt);

	// 8 is a 55, meaning even with randomness an 8 is always a 50
	const scoreRaw = difficultyToScore(difficulty);

	return scoreRaw;
};

const getDunkScore = (dunkAttempt: DunkAttempt) => {
	return helpers.bound(
		getDunkScoreRaw(dunkAttempt) + random.randInt(-5, 5),
		LOWEST_POSSIBLE_SCORE,
		HIGHEST_POSSIBLE_SCORE,
	);
};

const getDunkInfoKey = (part: DunkPart) =>
	part === "toss" ? "toss" : part === "distance" ? "distance" : "move";

const getDunkInfosPart = (part: DunkPart, dunk: DunkAttempt) => {
	const dunkInfoKey = getDunkInfoKey(part);

	let infos;

	if (part === "move1") {
		infos = getValidMoves(dunk.move1);
	} else if (part === "move2") {
		infos = getValidMoves(dunk.move1);
	} else {
		infos = dunkInfos[dunkInfoKey];
	}

	return infos;
};

// Decrease difficulty a bit, but keep above minScoreNeeded
const makeDunkEasier = (
	dunk: DunkAttempt,
	minScoreNeeded: number | undefined,
) => {
	const parts: DunkPart[] = ["toss", "distance", "move1", "move2"];
	random.shuffle(parts);

	const newDunk = {
		...dunk,
	};

	for (const part of parts) {
		const infos = getDunkInfosPart(part, newDunk);

		const dunkInfoKey = getDunkInfoKey(part);
		const currentPartDifficulty =
			dunkInfos[dunkInfoKey][newDunk[part]].difficulty;

		// Pick part that keeps us under difficulty target
		const candidates = Object.entries(infos).filter(([key, info]) => {
			// Must be lower difficulty
			if (info.difficulty >= currentPartDifficulty) {
				return false;
			}

			// Must not take us below minScoreNeeded
			if (minScoreNeeded !== undefined) {
				if (
					getDunkScoreRaw({
						...newDunk,
						[part]: key,
					}) < minScoreNeeded
				) {
					return false;
				}
			}

			return true;
		});
		if (candidates.length === 0) {
			continue;
		}

		const candidate = random.choice(candidates);
		newDunk[part] = candidate[0];

		// Making one component easier is good enough
		break;
	}

	return newDunk;
};

// Increase difficulty so it's at least minScoreNeeded
const makeDunkHarder = (dunk: DunkAttempt, minScoreNeeded: number) => {};

const genDunk = (preDunkInfo: PreDunkInfo) => {
	let dunk: DunkAttempt;

	if (preDunkInfo.priorAttempt) {
		if (preDunkInfo.numPriorAttempts === NUM_ATTEMPTS_PER_DUNK - 1) {
			// Make it a bit easier for the last attempt, if possible
			dunk = makeDunkEasier(
				preDunkInfo.priorAttempt,
				preDunkInfo.minScoreNeeded,
			);
		} else {
			// Try previous dunk again
			dunk = {
				...preDunkInfo.priorAttempt,
			};
		}
	} else {
		let targetDifficulty: number =
			"some difficulty based on 50% chance of success";
		if (targetDifficulty > MAX_SCORE_DIFFICULTY) {
			targetDifficulty = MAX_SCORE_DIFFICULTY;
		} else if (preDunkInfo.minScoreNeeded !== undefined) {
			const minDifficultyNeeded = scoreToDifficulty(preDunkInfo.minScoreNeeded);
			if (minDifficultyNeeded < targetDifficulty) {
				targetDifficulty = minDifficultyNeeded;
			}
		}

		const parts: DunkPart[] = ["toss", "distance", "move1", "move2"];
		random.shuffle(parts);

		dunk = {
			toss: "none",
			distance: "at-rim",
			move1: "none",
			move2: "none",
		};

		let difficulty = 0;

		for (const part of parts) {
			const infos = getDunkInfosPart(part, dunk);

			// Pick part that keeps us under difficulty target

			const candidates = Object.entries(infos).filter(
				([, info]) =>
					difficulty + info.difficulty <= targetDifficulty &&
					info.difficulty > 0,
			);
			if (candidates.length === 0) {
				continue;
			}

			// More likely to pick harder ones, but not guaranteed
			const candidate = random.choice(
				candidates,
				([, info]) => info.difficulty,
			);

			dunk[part] = candidate[0];
			difficulty += candidate[1].difficulty;
		}

		if (
			preDunkInfo.minScoreNeeded !== undefined &&
			scoreToDifficulty(preDunkInfo.minScoreNeeded) > difficulty
		) {
			dunk = makeDunkHarder(dunk, preDunkInfo.minScoreNeeded);
		}
	}

	return dunk;
};

export const getRoundResults = (round: Dunk["rounds"][number]) => {
	const resultsByIndex: Record<
		number,
		{
			index: number;
			numDunks: number;
			score: number;
			scores: number[];
		}
	> = {};

	for (const index of round.dunkers) {
		resultsByIndex[index] = {
			index,
			numDunks: 0,
			score: 0,
			scores: [],
		};
	}

	for (const dunk of round.dunks) {
		if (dunk.score !== undefined) {
			resultsByIndex[dunk.index].numDunks += 1;
			resultsByIndex[dunk.index].score += dunk.score;
			resultsByIndex[dunk.index].scores.push(dunk.score);
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
	dunkAttempt: DunkAttempt,
	preDunkInfo: PreDunkInfo,
) => {
	return Math.random() < 0.5;
};

// If some dunks have already happened in this round, what's the minimum score this dunk needs to stay alive for the next round?
const getMinScoreNeeded = (
	currentRound: Dunk["rounds"][number],
	nextDunkerIndex: number,
) => {
	const numDunksPerPlayer = currentRound.tiebreaker ? 1 : 2;

	// Doesn't quite work for all tiebreakers, but oh well
	const numPlayersAdvance = Math.floor(currentRound.dunkers.length / 2);

	const scoresByIndex: Record<
		number,
		{
			index: number;
			numDunks: number;
			score: number;
		}
	> = {};

	for (const { score, index } of currentRound.dunks) {
		if (score !== undefined) {
			if (!scoresByIndex[index]) {
				scoresByIndex[index] = {
					index,
					numDunks: 1,
					score,
				};
			} else {
				scoresByIndex[index].numDunks += 1;
				scoresByIndex[index].score += score;
			}
		}
	}

	const numDunks = scoresByIndex[nextDunkerIndex]?.numDunks ?? 0;
	if (numDunksPerPlayer - numDunks > 1) {
		// Player has 2 dunks left, don't worry about it
		return undefined;
	}

	const currentScore = scoresByIndex[nextDunkerIndex]?.score ?? 0;

	const otherScores = orderBy(
		Object.values(scoresByIndex)
			.filter(row => row.index !== nextDunkerIndex)
			.map(row => ({
				...row,
				minScore:
					row.score +
					(numDunksPerPlayer - row.numDunks) * LOWEST_POSSIBLE_SCORE,
			})),
		"minScore",
		"desc",
	);

	const target = otherScores[numPlayersAdvance - 1]?.minScore;

	if (target === undefined) {
		return undefined;
	}

	const minScoreNeeded = helpers.bound(
		target - currentScore,
		LOWEST_POSSIBLE_SCORE,
		HIGHEST_POSSIBLE_SCORE,
	);

	return minScoreNeeded;
};

export const simNextDunkEvent = async (
	conditions: Conditions,
): Promise<"event" | "dunk" | "round" | "all"> => {
	let type: "event" | "dunk" | "round" | "all" = "event";

	const allStars = await idb.cache.allStars.get(g.get("season"));
	const dunk = allStars?.dunk;
	if (!dunk) {
		throw new Error("No dunk contest found");
	}

	if (dunk.winner !== undefined) {
		// Already over
		type = "all";
		return type;
	}

	// Figure out current dunker
	const nextDunkerIndex = getNextDunkerIndex(dunk);
	if (nextDunkerIndex === undefined) {
		throw new Error("nextDunkerIndex should not be undefined");
		// ...because it's called again at the end of this function, and undefineds are handled there
	}

	let stillSamePlayersTurn = true;

	const currentRound = dunk.rounds.at(-1);
	let lastDunk = currentRound.dunks.at(-1);

	if (
		lastDunk &&
		lastDunk.index === nextDunkerIndex &&
		(lastDunk.made || lastDunk.attempts.length >= NUM_ATTEMPTS_PER_DUNK)
	) {
		// Score previous dunk
		if (lastDunk.made) {
			lastDunk.score = getDunkScore(lastDunk.attempts.at(-1));
		} else {
			lastDunk.score = LOWEST_POSSIBLE_SCORE;
		}

		stillSamePlayersTurn = false;
		type = "dunk";
	} else {
		// New dunk attempt
		if (lastDunk?.index !== nextDunkerIndex) {
			// New dunker!
			lastDunk = {
				index: nextDunkerIndex,
				attempts: [],
				made: false,
			};
			currentRound.dunks.push(lastDunk);
		}

		const p = await idb.cache.players.get(dunk.players[nextDunkerIndex].pid);
		if (!p) {
			throw new Error("Invalid pid");
		}
		const ratings = p.ratings.at(-1) as PlayerRatings;
		const preDunkInfo: PreDunkInfo = {
			jmp: ratings.jmp,
			dnk: ratings.dnk,
			numPriorAttempts: lastDunk.attempts.length,
			priorAttempt: lastDunk.attempts.at(-1),
			minScoreNeeded: getMinScoreNeeded(currentRound, nextDunkerIndex),
		};

		const dunkToAttempt = genDunk(preDunkInfo);

		const success = await getDunkOutcome(dunkToAttempt, preDunkInfo);
		lastDunk.attempts.push(dunkToAttempt);
		lastDunk.made = success;

		// No score yet, will be done next time this function is called
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
				type = "round";

				dunk.rounds.push({
					dunkers: indexesForNextRound,
					dunks: [],
				});
			} else if (outcome === "tiebreakerRound") {
				type = "round";

				dunk.rounds.push({
					dunkers: indexesForNextTiebreaker,
					dunks: [],
					tiebreaker: true,
				});
			} else {
				type = "all";

				dunk.winner = indexesForNextRound[0];

				const p = dunk.players[dunk.winner];

				await saveAwardsByPlayer(
					[
						{
							pid: p.pid,
							tid: p.tid,
							name: p.name,
							type: "Slam Dunk Contest Winner",
						},
					],
					conditions,
					g.get("season"),
					true,
				);
			}
		}
	}

	await idb.cache.allStars.put(allStars);

	return type;
};
