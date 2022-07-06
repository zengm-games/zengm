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

	set(keys: number[], value: number) {
		const key = JSON.stringify(keys);
		this.probs[key] = value;

		if (keys.length === this.numPicksInLottery) {
			const keyMerged = JSON.stringify(keys.sort());
			if (this.probsMerged[keyMerged] === undefined) {
				this.probsMerged[keyMerged] = 0;
			}
			this.probsMerged[keyMerged] += value;
		}
	}

	get(keys: number[]) {
		const key = JSON.stringify(keys);
		return this.probs[key];
	}

	mergedEntries() {
		return Object.entries(this.probsMerged);
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
		numPicksInLottery = 4;
	} else {
		numPicksInLottery = 3;
	}

	const probsCache = new ProbsCache(numPicksInLottery);

	// Get probabilities of top N picks for all teams
	for (let i = 0; i < result.length; i++) {
		probs[i] = [];

		// Odds of 1st pick are simple
		const prob = result[i].chances / totalChances;
		probs[i][0] = prob;
		probsCache.set([i], prob);

		// Initialize odds of other picks determined in the lottery
		for (let j = 1; j < numPicksInLottery; j++) {
			probs[i][j] = 0;
		}
	}

	// i: current team
	for (let i = 0; i < result.length; i++) {
		// k: team that got 1st pick
		for (let k = 0; k < result.length; k++) {
			if (k === i) {
				// Skip case where this team already got an earlier pick
				continue;
			}

			const prob =
				(probsCache.get([k]) * result[i].chances) /
				(totalChances - result[k].chances);
			probs[i][1] += prob;
			probsCache.set([k, i], prob);
		}
	}

	for (let i = 0; i < result.length; i++) {
		for (let k = 0; k < result.length; k++) {
			if (k === i) {
				continue;
			}

			// l: team that got 2st pick
			for (let l = 0; l < result.length; l++) {
				if (l === i || l === k) {
					continue;
				}
				const prob =
					(probsCache.get([k, l]) * result[i].chances) /
					(totalChances - result[k].chances - result[l].chances);
				probs[i][2] += prob;
				probsCache.set([k, l, i], prob);
			}
		}
	}

	for (let i = 0; i < result.length; i++) {
		for (let k = 0; k < result.length; k++) {
			if (k === i) {
				continue;
			}
			for (let l = 0; l < result.length; l++) {
				if (l === i || l === k) {
					continue;
				}
				if (numPicksInLottery > 3) {
					// Go one level deeper
					// m: team that got 3st pick
					for (let m = 0; m < result.length; m++) {
						if (m === i || m === k || m === l) {
							continue;
						}

						const prob =
							(probsCache.get([k, l, m]) * result[i].chances) /
							(totalChances -
								result[k].chances -
								result[l].chances -
								result[m].chances);
						probs[i][3] += prob;
						probsCache.set([k, l, m, i], prob);
					}
				}
			}
		}
	}

	// Fill in picks (N+1)+
	for (let i = 0; i < result.length; i++) {
		// Probabilities of being "skipped" (lower prob team in top N) i times. +1 is for when skipped 0 times, in addition to being skipped possibly up to numPicksInLottery times
		const skipped = Array(numPicksInLottery + 1).fill(0);

		for (const [key, prob] of probsCache.mergedEntries()) {
			const inds = JSON.parse(key);
			let skipCount = 0;

			for (const ind of inds) {
				if (ind > i) {
					skipCount += 1;
				}
			}

			if (!inds.includes(i)) {
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
