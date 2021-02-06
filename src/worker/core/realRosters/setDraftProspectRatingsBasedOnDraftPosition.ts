import { RATINGS } from "../../../common/constants.basketball";
import type { RatingKey } from "../../../common/types.basketball";
import player from "../player";
import potEstimator from "../player/potEstimator";

/*
Run this script in the worker console in a random players league (30 teams) to get the data:

N = 1000;
sums = undefined;
for (let i = 0; i < N; i++) {
    console.log(i);
    const players = await bbgm.draft.genPlayersWithoutSaving(0, 15.5, []);
    const values = players.map(p => bbgm.player.valueCombineOvrPot(p.ratings[0].ovr, p.ratings[0].pot, -p.born.year)).sort((a, b) => b - a);
    if (sums === undefined) {
        sums = Array(values.length).fill(0);
    }
    for (let j = 0; j < sums.length; j++) {
        sums[j] += values[j] / N;
    }
}
console.log(`const VALUE_BY_PICK = ${JSON.stringify(sums.map(sum => parseFloat(sum.toFixed(1))).slice(0, 60))};\nconst VALUE_UNDRAFTED = ${sums[63].toFixed(1)};`);
*/
const VALUE_BY_PICK = [
	64.3,
	61.7,
	60.1,
	58.9,
	58.1,
	57.3,
	56.7,
	56.1,
	55.5,
	55.1,
	54.7,
	54.3,
	53.9,
	53.5,
	53.2,
	52.9,
	52.6,
	52.3,
	52,
	51.7,
	51.5,
	51.2,
	51,
	50.7,
	50.5,
	50.3,
	50,
	49.8,
	49.6,
	49.3,
	49.1,
	48.9,
	48.6,
	48.4,
	48.2,
	48,
	47.8,
	47.5,
	47.3,
	47.1,
	46.8,
	46.6,
	46.3,
	46.1,
	45.8,
	45.5,
	45.2,
	44.9,
	44.6,
	44.2,
	43.9,
	43.5,
	43.1,
	42.6,
	42.2,
	41.7,
	41.2,
	40.7,
	40.2,
	39.6,
];
const VALUE_UNDRAFTED = 36.6;

const getValue = (ratings: Record<RatingKey, number>, age: number) => {
	const ovr = player.ovr(ratings as any);
	const pot = potEstimator(ovr, age);

	return player.valueCombineOvrPot(ovr, pot, age);
};

const setDraftProspectRatingsBasedOnDraftPosition = (
	ratings: Record<RatingKey, number>,
	age: number,
	bio: { draftRound: number; draftPick: number },
) => {
	// In theory this should change with draft class, but doesn't seem to matter too much
	const numTeams = 30;

	let index;

	if (bio.draftRound < 1 || bio.draftPick < 1) {
		index = Infinity;
	} else {
		index = (bio.draftRound - 1) * numTeams + (bio.draftPick - 1);

		// Handle years when numTeams is not 30
		index *= 30 / numTeams;
	}

	let targetValue;
	if (index >= VALUE_BY_PICK.length) {
		targetValue = VALUE_UNDRAFTED;
	} else if (Number.isInteger(index)) {
		targetValue = VALUE_BY_PICK[index];
	} else {
		const remainder = index % 1;
		const lower = Math.floor(index);
		targetValue =
			(1 - remainder) * VALUE_BY_PICK[lower] +
			remainder * VALUE_BY_PICK[lower + 1];
	}

	let value = getValue(ratings, age);
	let diff = targetValue - value;
	if (Math.abs(diff) < 1) {
		return;
	}

	const direction = Math.sign(diff);
	if (direction !== 1 && direction !== -1) {
		throw new Error("Invalid direction");
	}

	while (true) {
		for (const rating of RATINGS) {
			if (rating !== "hgt") {
				ratings[rating] = player.limitRating(ratings[rating] + direction);
			}
		}

		value = getValue(ratings, age);
		diff = targetValue - value;

		if ((diff <= 0 && direction === 1) || (diff >= 0 && direction === -1)) {
			return;
		}
	}
};

export default setDraftProspectRatingsBasedOnDraftPosition;
