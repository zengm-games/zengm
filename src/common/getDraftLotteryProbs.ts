import type { DraftLotteryResultArray, DraftType } from "./types";

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
	const topNCombos = new Map();
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
		numPicksInLottery = 6;
	} else {
		numPicksInLottery = 3;
	}

	// Get probabilities of top N picks for all teams
	for (let i = 0; i < result.length; i++) {
		probs[i] = [];

		// Odds of 1st pick are simple
		probs[i][0] = result[i].chances / totalChances;

		// Initialize odds of other picks determined in the lottery
		for (let j = 1; j < numPicksInLottery; j++) {
			probs[i][j] = 0;
		}
	}

	for (let i = 0; i < result.length; i++) {
		for (let k = 0; k < result.length; k++) {
			if (k === i) {
				// Skip case where this team already got an earlier pick
				continue;
			}

			probs[i][1] +=
				(probs[k][0] * result[i].chances) / (totalChances - result[k].chances);

			for (let l = 0; l < result.length; l++) {
				if (l !== i && l !== k) {
					const combosTemp =
						(probs[k][0] *
							(result[l].chances / (totalChances - result[k].chances)) *
							result[i].chances) /
						(totalChances - result[k].chances - result[l].chances);
					probs[i][2] += combosTemp;

					if (draftType === "nba2019") {
						// Go one level deeper
						for (let m = 0; m < result.length; m++) {
							if (m !== i && m !== k && m !== l) {
								const combosTemp2 =
									(probs[k][0] *
										(result[l].chances / (totalChances - result[k].chances)) *
										(result[m].chances /
											(totalChances - result[k].chances - result[l].chances)) *
										result[i].chances) /
									(totalChances -
										result[k].chances -
										result[l].chances -
										result[m].chances);
								probs[i][3] += combosTemp2;
								const topFourKey = JSON.stringify([i, k, l, m].sort());

								if (!topNCombos.has(topFourKey)) {
									topNCombos.set(topFourKey, combosTemp2);
								} else {
									topNCombos.set(
										topFourKey,
										topNCombos.get(topFourKey) + combosTemp2,
									);
								}
							}
						}
					} else {
						const topThreeKey = JSON.stringify([i, k, l].sort());

						if (!topNCombos.has(topThreeKey)) {
							topNCombos.set(topThreeKey, combosTemp);
						} else {
							topNCombos.set(
								topThreeKey,
								topNCombos.get(topThreeKey) + combosTemp,
							);
						}
					}
				}
			}
		}
	}

	// Fill in picks (N+1)+
	for (let i = 0; i < result.length; i++) {
		// Probabilities of being "skipped" (lower prob team in top N) i times. +1 is for when skipped 0 times, in addition to being skipped possibly up to numPicksInLottery times
		const skipped = Array(numPicksInLottery + 1).fill(0);

		for (const [key, prob] of topNCombos.entries()) {
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
