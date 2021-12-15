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

	// Top N picks
	for (let i = 0; i < result.length; i++) {
		probs[i] = [];
		probs[i][0] = result[i].chances / totalChances; // First pick

		probs[i][1] = 0; // Second pick

		probs[i][2] = 0; // Third pick

		if (draftType === "nba2019") {
			probs[i][3] = 0; // Fourth pick
		}

		for (let k = 0; k < result.length; k++) {
			if (k !== i) {
				probs[i][1] +=
					((result[k].chances / totalChances) * result[i].chances) /
					(totalChances - result[k].chances);

				for (let l = 0; l < result.length; l++) {
					if (l !== i && l !== k) {
						const combosTemp =
							((result[k].chances / totalChances) *
								(result[l].chances / (totalChances - result[k].chances)) *
								result[i].chances) /
							(totalChances - result[k].chances - result[l].chances);
						probs[i][2] += combosTemp;

						if (draftType === "nba2019") {
							// Go one level deeper
							for (let m = 0; m < result.length; m++) {
								if (m !== i && m !== k && m !== l) {
									const combosTemp2 =
										((result[k].chances / totalChances) *
											(result[l].chances / (totalChances - result[k].chances)) *
											(result[m].chances /
												(totalChances -
													result[k].chances -
													result[l].chances)) *
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
	}

	// Fill in picks (N+1)+
	for (let i = 0; i < result.length; i++) {
		const skipped = [0, 0, 0, 0, 0]; // Probabilities of being "skipped" (lower prob team in top N) 0/1/2/3/4 times

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
		for (let j = 0; j < (draftType === "nba2019" ? 5 : 4); j++) {
			if (i + j > (draftType === "nba2019" ? 3 : 2) && i + j < result.length) {
				probs[i][i + j] = skipped[j];
			}
		}
	}

	return probs;
};

export default getDraftLotteryProbs;
