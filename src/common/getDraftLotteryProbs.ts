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

const getDraftLotteryProbs = (
	result: DraftLotteryResultArray | undefined,
	draftType: DraftType | "dummy" | undefined,
): (number | undefined)[][] | undefined => {
	if (
		result === undefined ||
		draftType === undefined ||
		draftType === "random" ||
		draftType === "noLottery" ||
		draftType === "noLotteryReverse" ||
		draftType === "freeAgents" ||
		draftType === "dummy"
	) {
		return;
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

		return probs;
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

		return probs;
	}

	let numPicksInLottery;
	if (draftType === "nba2019") {
		numPicksInLottery = 4;
	} else if (draftType === "mlb2022") {
		numPicksInLottery = 5;
	} else {
		numPicksInLottery = 3;
	}

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

	console.time("foo");
	for (let pickIndex = 0; pickIndex < numPicksInLottery; pickIndex += 1) {
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
	console.timeEnd("foo");

	return probs;
};

export default getDraftLotteryProbs;
