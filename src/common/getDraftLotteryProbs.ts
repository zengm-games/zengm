import type { DraftLotteryResultArray, DraftType } from "./types";

class ProbsCache {
	// Key indexes of teams winning the first N picks in order (could be any number of picks from 1 to numPicksInLottery, all get stored here), value is probability of that happening
	probs: Record<string, number>;

	// Same as probs, but we don't care about order of key ([1,5] is same as [5,1], and probs get added up) and we only care about fully specified lotteries (keys length equal to numPicksInLottery)
	probsMerged: Record<string, number>;

	numPicksInLottery: number;

	constructor(numPicksInLottery: number) {
		this.numPicksInLottery = numPicksInLottery;
		this.probs = {};
		this.probsMerged = {};
	}

	static stringifyKey(keys: number[]) {
		return keys.join(",");
	}

	static parseKey(key: string): number[] {
		return key.split(",").map(x => parseInt(x));
	}

	set(keys: number[], key: string, value: number) {
		// Only need to cache intermediate values here, final values will never be needed again, except in the aggregate form of probsMerged
		if (keys.length < this.numPicksInLottery) {
			this.probs[key] = value;
		} else {
			const keyMerged = ProbsCache.stringifyKey([...keys].sort());
			if (this.probsMerged[keyMerged] === undefined) {
				this.probsMerged[keyMerged] = value;
			} else {
				this.probsMerged[keyMerged] += value;
			}
		}
	}

	get(key: string) {
		return this.probs[key];
	}

	mergedEntries() {
		return Object.entries(this.probsMerged).map(row => {
			const parsed = ProbsCache.parseKey(row[0]);
			return [parsed, row[1]] as const;
		});
	}
}

class MultiDimensionalRange {
	start: number;
	end: number;
	dimensions: number;

	constructor(end: number, dimensions: number) {
		this.start = 0;
		this.end = end;
		this.dimensions = dimensions;
	}

	[Symbol.iterator]() {
		const value = Array(this.dimensions).fill(this.start);

		const getNextValue = (dimension: number): boolean => {
			if (value[dimension] < this.end - 1) {
				value[dimension] += 1;
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

	const probsCache = new ProbsCache(numPicksInLottery);

	// Get probabilities of top N picks for all teams
	for (let i = 0; i < result.length; i++) {
		probs[i] = [];
	}

	const getProb = (indexes: number[]): number => {
		const indexesString = ProbsCache.stringifyKey(indexes);
		const cached = probsCache.get(indexesString);
		if (cached !== undefined) {
			return cached;
		}

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

		if (probs[currentTeamIndex][indexes.length - 1] === undefined) {
			probs[currentTeamIndex][indexes.length - 1] = prob;
		} else {
			probs[currentTeamIndex][indexes.length - 1] += prob;
		}

		probsCache.set(indexes, indexesString, prob);

		return prob;
	};

	console.time("foo");
	const range = new MultiDimensionalRange(result.length, numPicksInLottery);
	for (const indexes of range) {
		if (indexes.length !== new Set(indexes).size) {
			// Skip case where this team already got an earlier pick
			continue;
		}

		// We're looking at every combination of lottery results. getProb will fill in the probability of this result in probs
		getProb(indexes);
	}
	console.timeEnd("foo");

	// Fill in picks (N+1)+
	for (let i = 0; i < result.length; i++) {
		// Probabilities of being "skipped" (lower prob team in top N) i times. +1 is for when skipped 0 times, in addition to being skipped possibly up to numPicksInLottery times
		const skipped = Array(numPicksInLottery + 1).fill(0);

		for (const [indexes, prob] of probsCache.mergedEntries()) {
			let skipCount = 0;

			for (const ind of indexes) {
				if (ind > i) {
					skipCount += 1;
				}
			}

			if (!indexes.includes(i)) {
				skipped[skipCount] += prob;
			}
		}

		// Fill in table after first N picks
		for (let j = 0; j < numPicksInLottery + 1; j++) {
			if (i + j > numPicksInLottery - 1 && i + j < result.length) {
				probs[i][i + j] = skipped[j];
			}
		}
	}

	return probs;
};

export default getDraftLotteryProbs;
