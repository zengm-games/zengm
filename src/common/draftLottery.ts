import type { DraftLotteryResultArray, DraftType } from "./types";

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

// chances does not have to be the perfect length. If chances is too long for numLotteryTeams, it will be truncated. If it's too short, the last entry will be repeated until it's long enough.
export const getLotteryInfo = (
	draftType: DraftType,
	numLotteryTeams: number,
) => {
	if (draftType === "coinFlip") {
		return {
			minNumTeams: 2,
			numToPick: 2,
			chances: [1, 1, 0],
		};
	}

	if (draftType === "randomLottery") {
		return {
			minNumTeams: numLotteryTeams,
			numToPick: numLotteryTeams,
			chances: [1],
		};
	}

	if (draftType === "randomLotteryFirst3") {
		return {
			minNumTeams: 3,
			numToPick: 3,
			chances: [1],
		};
	}

	if (draftType === "nba1990") {
		const chances = [];
		for (let i = numLotteryTeams; i > 0; i--) {
			chances.push(i);
		}

		return {
			minNumTeams: 3,
			numToPick: 3,
			chances,
		};
	}

	if (draftType === "nba1994") {
		return {
			minNumTeams: 3,
			numToPick: 3,
			chances: [250, 199, 156, 119, 88, 63, 43, 28, 17, 11, 8, 7, 6, 5],
		};
	}

	if (draftType === "nba2019") {
		return {
			minNumTeams: 4,
			numToPick: 4,
			chances: [140, 140, 140, 125, 105, 90, 75, 60, 45, 30, 20, 15, 10, 5],
		};
	}

	if (draftType === "nhl2017") {
		return {
			minNumTeams: 3,
			numToPick: 3,
			chances: [185, 135, 115, 95, 85, 75, 65, 60, 50, 35, 30, 25, 20, 15, 10],
		};
	}

	if (draftType === "mlb2022") {
		return {
			minNumTeams: 6,
			numToPick: 6,
			chances: [
				1650, 1650, 1650, 1325, 1000, 750, 550, 390, 270, 180, 140, 110, 90, 76,
				62, 48, 36, 23,
			],
		};
	}

	throw new Error(`Unsupported draft type "${draftType}"`);
};

const draftLotteryProbsTooSlow = (draftType: DraftType, numTeams: number) => {
	const count = numTeams ** getLotteryInfo(draftType, numTeams).numToPick;

	// This will happen for baseball (18 teams, 6 picks)
	return count >= 1e7;
};

export const getDraftLotteryProbs = (
	result: DraftLotteryResultArray | undefined,
	draftType: DraftType | "dummy" | undefined,
): {
	tooSlow: boolean;
	probs?: (number | undefined)[][];
} => {
	if (
		result === undefined ||
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

	const probs: number[][] = [];
	const totalChances = result.reduce(
		(total, { chances }) => total + chances,
		0,
	);

	if (draftType === "randomLottery") {
		for (let i = 0; i < result.length; i++) {
			probs[i] = [];
			for (let j = 0; j < result.length; j++) {
				probs[i][j] = 1 / result.length;
			}
		}

		return {
			tooSlow: false,
			probs,
		};
	}

	if (draftType === "coinFlip") {
		for (let i = 0; i < result.length; i++) {
			probs[i] = [];
			for (let j = 0; j < result.length; j++) {
				if (i === 0 && j <= 1) {
					probs[i][j] = 0.5;
				} else if (i === 1 && j <= 1) {
					probs[i][j] = 0.5;
				} else if (i === j) {
					probs[i][j] = 1;
				} else {
					probs[i][j] = 0;
				}
			}
		}

		return {
			tooSlow: false,
			probs,
		};
	}

	const tooSlow = draftLotteryProbsTooSlow(draftType, result.length);

	const numPicksInLottery = getLotteryInfo(draftType, result.length).numToPick;

	const skipped: number[][] = [];

	// Get probabilities of top N picks for all teams
	for (let i = 0; i < result.length; i++) {
		probs[i] = [];

		// Initialize values that we'll definitely fill in soon
		for (let j = 0; j < numPicksInLottery; j++) {
			probs[i][j] = 0;
		}

		// +1 is to handle the case of 0 skips to N skips
		skipped[i] = Array(numPicksInLottery + 1).fill(0);
	}

	const getProb = (indexes: number[]): number => {
		const currentTeamIndex = indexes[0];
		const prevLotteryWinnerIndexes = indexes.slice(1);

		let chancesLeft = totalChances;
		for (const prevTeamIndex of prevLotteryWinnerIndexes) {
			chancesLeft -= result[prevTeamIndex].chances;
		}

		const priorProb =
			prevLotteryWinnerIndexes.length === 0
				? 1
				: getProb(prevLotteryWinnerIndexes);

		const prob = (priorProb * result[currentTeamIndex].chances) / chancesLeft;

		return prob;
	};

	for (let pickIndex = 0; pickIndex < numPicksInLottery; pickIndex += 1) {
		if (tooSlow && pickIndex > 0) {
			break;
		}

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
			probs[currentTeamIndex][pickIndex] += prob;

			// For the later picks, account for how many times each team was "skipped" (lower lottery team won lottery and moved ahead) and keep track of those probabilities
			if (pickIndex === numPicksInLottery - 1) {
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

					skipped[i][skipCount] += prob;
				}
			}
		}
	}

	// Fill in picks (N+1)+
	for (let i = 0; i < result.length; i++) {
		// Fill in table after first N picks
		for (let j = 0; j < numPicksInLottery + 1; j++) {
			if (i + j > numPicksInLottery - 1 && i + j < result.length) {
				probs[i][i + j] = skipped[i][j];
			}
		}
	}

	return {
		tooSlow,
		probs,
	};
};
