import type { AllStars } from "../../../common/types";

type Three = NonNullable<AllStars["three"]>;

export const NUM_SHOOTERS_IN_CONTEST = 8;

export const getRoundResults = (round: Three["rounds"][number]) => {
	const resultsByIndex: Record<
		number,
		{
			index: number;
			score: number;
		}
	> = {};

	for (const index of round.indexes) {
		resultsByIndex[index] = {
			index,
			score: 0,
		};
	}

	for (const result of round.results) {
		for (const racks of result.racks) {
			for (const shot of racks) {
				if (shot) {
					resultsByIndex[result.index].score += 1;
				}
			}
		}
	}

	return Object.values(resultsByIndex);
};
