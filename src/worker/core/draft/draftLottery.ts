import { RESTRICTED_1_PICK, RESTRICTED_5_PICK } from "./nba2027.ts";
import { isSport } from "../../../common/sportFunctions.ts";
import type {
	DraftLotteryResult,
	DraftLotteryResultArray,
	DraftType,
} from "../../../common/types.ts";
import { precomputedMlb2022 } from "./precomputedDraftLotteryProbs.ts";

class MultiDimensionalRange {
	initial: boolean;
	start: number;
	end: number;
	dimensions: number;

	constructor(end: number, dimensions: number) {
		this.initial = true;
		this.start = 0;
		this.end = end;
		this.dimensions = dimensions;
	}

	[Symbol.iterator]() {
		const value = Array(this.dimensions).fill(this.start);

		const getNextValue = (dimension: number): boolean => {
			if (value[dimension] < this.end - 1) {
				if (this.initial) {
					this.initial = false;
				} else {
					value[dimension] += 1;
				}
				return false;
			}

			if (dimension === 0) {
				return true;
			}

			for (let i = dimension; i < this.dimensions; i++) {
				value[i] = this.start;
			}
			return getNextValue(dimension - 1);
		};

		return {
			next: () => {
				const dimension = this.dimensions - 1;
				const done = getNextValue(dimension);
				if (done) {
					return {
						done,
					};
				}

				return {
					value,
					done,
				};
			},
		};
	}
}

const draftLotteryProbsTooSlow = (numTeams: number, numToPick: number) => {
	const count = numTeams ** numToPick;

	// This will happen for baseball (18 teams, 6 picks) except for the hardcoded default
	return count >= 1e7;
};

// This is needed to handle restricted1/restricted5 for nba2027 easily, otherwise could just be an array
class PickIndexes {
	indexes: number[] = [];
	private nba2027:
		| {
				restrictions: NonNullable<DraftLotteryResult["nba2027"]>;
				pending1: number[];
				pending5: number[];
		  }
		| undefined;

	constructor(nba2027Restrictions: DraftLotteryResult["nba2027"]) {
		if (nba2027Restrictions) {
			this.nba2027 = {
				pending1: [],
				pending5: [],
				restrictions: nba2027Restrictions,
			};
		}
	}

	add(index: number) {
		if (this.nba2027) {
			// If we are already past pick 5, then we don't need to worry about giving this pick special treatment
			if (this.indexes.length < RESTRICTED_5_PICK) {
				// restricted5 takes precedence over restricted1
				if (this.nba2027.restrictions.restricted5.includes(index)) {
					this.nba2027.pending5.push(index);
					return;
				} else if (
					this.indexes.length < RESTRICTED_1_PICK &&
					this.nba2027.restrictions.restricted1.includes(index)
				) {
					this.nba2027.pending1.push(index);
					return;
				}
			}
		}

		this.indexes.push(index);

		if (this.nba2027) {
			// If we just added pick 1 or pick 5, then handle pending picks
			if (
				this.indexes.length === RESTRICTED_1_PICK &&
				this.nba2027.pending1.length > 0
			) {
				this.indexes.push(...this.nba2027.pending1);
				this.nba2027.pending1 = [];
			}

			// Not elseif in case somehow the above push triggered this limit too (would need to have customizable limits or somehow 4+ #1 picks)
			if (
				this.indexes.length === RESTRICTED_5_PICK &&
				this.nba2027.pending5.length > 0
			) {
				this.indexes.push(...this.nba2027.pending5);
				this.nba2027.pending5 = [];
			}
		}
	}

	doneNba2027() {
		return (
			!this.nba2027 ||
			(this.nba2027.pending1.length === 0 && this.nba2027.pending5.length === 0)
		);
	}
}

export const simLottery = (
	draftType: DraftType,
	chances: number[],
	numToPick: number,
	nba2027Restrictions: DraftLotteryResult["nba2027"],
) => {
	let teams = chances.map((chance, index) => ({
		chances: chance,
		index,
	}));

	const pickIndexes = new PickIndexes(nba2027Restrictions);

	const top12GuaranteedLimit = 12;
	const top12Guaranteed =
		draftType === "nba2027" ? new Set(teams.slice(0, 3)) : undefined;

	for (let i = 0; i < numToPick; i++) {
		// For example, if there are still 3 teams left to put in the top 12, then forceTop12 needs to become true when i=9 (10th pick)
		const numTop12GuaranteedLeft = top12Guaranteed?.size;
		const forceTop12 =
			numTop12GuaranteedLeft !== undefined && numTop12GuaranteedLeft > 0
				? i + numTop12GuaranteedLeft >= top12GuaranteedLimit
				: false;

		let sum = 0;
		for (const t of teams) {
			if (forceTop12 && !top12Guaranteed!.has(t)) {
				// No chances for this team, we need to pick one of the worst 3
			} else {
				sum += t.chances;
			}
		}
		const rand = Math.random() * sum;
		let sum2 = 0;
		for (const t of teams) {
			if (forceTop12 && !top12Guaranteed!.has(t)) {
				// No chances for this team, we need to pick one of the worst 3
			} else {
				sum2 += t.chances;
			}
			if (rand < sum2) {
				pickIndexes.add(t.index);
				teams = teams.filter((t2) => t2 !== t);
				if (top12Guaranteed) {
					top12Guaranteed.delete(t);
				}

				break;
			}
		}
	}

	for (const t of teams) {
		pickIndexes.add(t.index);
	}

	if (!pickIndexes.doneNba2027()) {
		throw new Error("Should never happen");
	}

	return pickIndexes.indexes;
};

// If it's too slow to calculate the precise probability, just estimate
const monteCarloLotteryProbs = (
	draftType: DraftType,
	result: DraftLotteryResultArray,
	numToPick: number,
	nba2027Restrictions: DraftLotteryResult["nba2027"],
) => {
	const ITERATIONS = 100000;

	const probs: number[][] = [];

	const chances = result.map((row) => row.chances);

	for (let i = 0; i < ITERATIONS; i++) {
		const result = simLottery(
			draftType,
			chances,
			numToPick,
			nba2027Restrictions,
		);
		for (let j = 0; j < result.length; j++) {
			const k = result[j]!;
			probs[k] ??= [];
			probs[k][j] ??= 0;
			// @ts-expect-error
			probs[k][j] += 1 / ITERATIONS;
		}
	}

	return probs;
};

export const getDraftLotteryProbs = (
	draftLotteryResult: DraftLotteryResult<boolean> | undefined,
	draftType: DraftType | "dummy" | undefined,
	numToPick: number,
): {
	tooSlow: boolean;
	probs?: (number | undefined)[][];
} => {
	if (
		draftLotteryResult?.result === undefined ||
		draftType === undefined ||
		draftType === "random" ||
		draftType === "noLottery" ||
		draftType === "noLotteryReverse" ||
		draftType === "freeAgents" ||
		draftType === "dummy"
	) {
		return {
			tooSlow: false,
		};
	}

	const result = draftLotteryResult.result;

	const probs: number[][] = [];
	const totalChances = result.reduce(
		(total, { chances }) => total + chances,
		0,
	);

	if (draftType === "randomLottery") {
		for (let i = 0; i < result.length; i++) {
			probs[i] = new Array(result.length).fill(1 / result.length);
		}

		return {
			tooSlow: false,
			probs,
		};
	}

	if (draftType === "coinFlip") {
		for (let i = 0; i < result.length; i++) {
			const row = [];
			for (let j = 0; j < result.length; j++) {
				if (i === 0 && j <= 1) {
					row[j] = 0.5;
				} else if (i === 1 && j <= 1) {
					row[j] = 0.5;
				} else if (i === j) {
					row[j] = 1;
				} else {
					row[j] = 0;
				}
			}
			probs[i] = row;
		}

		return {
			tooSlow: false,
			probs,
		};
	}

	const tooSlow = draftLotteryProbsTooSlow(result.length, numToPick);

	if (tooSlow) {
		if (
			isSport("baseball") &&
			result.length === 18 &&
			draftType === "mlb2022"
		) {
			return {
				tooSlow: false,
				probs: precomputedMlb2022,
			};
		} else {
			// Estimate probs
			return {
				tooSlow,
				probs: monteCarloLotteryProbs(
					draftType,
					result,
					numToPick,
					draftLotteryResult.nba2027,
				),
			};
		}
	}

	const skipped: number[][] = [];

	// Get probabilities of top N picks for all teams
	for (let i = 0; i < result.length; i++) {
		// Initialize values that we'll definitely fill in soon
		probs[i] = new Array(numToPick).fill(0);

		// +1 is to handle the case of 0 skips to N skips
		skipped[i] = Array(numToPick + 1).fill(0);
	}

	const getProb = (indexes: number[]): number => {
		const currentTeamIndex = indexes[0]!;
		const prevLotteryWinnerIndexes = indexes.slice(1);

		let chancesLeft = totalChances;
		for (const prevTeamIndex of prevLotteryWinnerIndexes) {
			chancesLeft -= result[prevTeamIndex]!.chances;
		}

		const priorProb =
			prevLotteryWinnerIndexes.length === 0
				? 1
				: getProb(prevLotteryWinnerIndexes);

		const prob = (priorProb * result[currentTeamIndex]!.chances) / chancesLeft;

		return prob;
	};

	for (let pickIndex = 0; pickIndex < numToPick; pickIndex += 1) {
		const range = new MultiDimensionalRange(result.length, pickIndex + 1);
		for (const indexes of range) {
			const indexesSet = new Set(indexes);
			if (indexes.length !== indexesSet.size) {
				// Skip case where this team already got an earlier pick
				continue;
			}

			const currentTeamIndex = indexes[0];

			// We're looking at every combination of lottery results. getProb will fill in the probability of this result in probs
			const prob = getProb(indexes);
			probs[currentTeamIndex]![pickIndex]! += prob;

			// For the later picks, account for how many times each team was "skipped" (lower lottery team won lottery and moved ahead) and keep track of those probabilities
			if (pickIndex === numToPick - 1) {
				for (let i = 0; i < skipped.length; i++) {
					if (indexesSet.has(i)) {
						continue;
					}

					let skipCount = 0;
					for (const ind of indexes) {
						if (ind > i) {
							skipCount += 1;
						}
					}

					skipped[i]![skipCount]! += prob;
				}
			}
		}
	}

	// Fill in picks (N+1)+
	for (let i = 0; i < result.length; i++) {
		// Fill in table after first N picks
		for (let j = 0; j < numToPick + 1; j++) {
			if (i + j > numToPick - 1 && i + j < result.length) {
				// @ts-expect-error
				probs[i][i + j] = skipped[i][j];
			}
		}
	}

	return {
		tooSlow,
		probs,
	};
};
