import { coachingEffect } from "../../../common/budgetLevels.ts";
import { helpers } from "../../util/index.ts";
import limitRating from "./limitRating.ts";

export type ProgBreakdown = [number, number, number];

type BaseChangeBreakdown = {
	age: number;
	coaching: number;
	total: number;
};

export const addToProgBreakdown = (
	total: ProgBreakdown,
	added: ProgBreakdown,
) => {
	total[0] += added[0];
	total[1] += added[1];
	total[2] += added[2];
};

export const finalizeProgBreakdown = (
	progBreakdown: ProgBreakdown,
	finalTotalChange: number,
	numRatings: number,
): ProgBreakdown => {
	const age = progBreakdown[0];
	const coaching = progBreakdown[1];

	return [
		roundRatingChange(age / numRatings),
		roundRatingChange(coaching / numRatings),
		roundRatingChange((finalTotalChange - age - coaching) / numRatings),
	];
};

export const getBaseChange = (
	ageChange: number,
	randomChange: number,
	coachingLevel: number,
): BaseChangeBreakdown => {
	const beforeCoaching = ageChange + randomChange;
	const total =
		beforeCoaching *
		(1 + (beforeCoaching > 0 ? 1 : -1) * coachingEffect(coachingLevel));

	return {
		age: ageChange,
		coaching: total - beforeCoaching,
		total,
	};
};

export const getRatingChangeBreakdown = ({
	ageModifier,
	baseChange,
	changeLimits,
	factor,
	oldRating,
	scale = 1,
}: {
	ageModifier: number;
	baseChange: BaseChangeBreakdown;
	changeLimits: [number, number];
	factor: number;
	oldRating: number;
	scale?: number;
}): {
	newRating: number;
	progBreakdown: ProgBreakdown;
} => {
	const boundedChange = helpers.bound(
		(baseChange.total + ageModifier) * factor,
		changeLimits[0],
		changeLimits[1],
	);
	const newRating = limitRating(oldRating + scale * boundedChange);
	const appliedChange = newRating - oldRating;
	const age = scale * (baseChange.age + ageModifier) * factor;
	const coaching = scale * baseChange.coaching * factor;

	return {
		newRating,
		progBreakdown: [age, coaching, appliedChange - age - coaching],
	};
};

const roundRatingChange = (change: number) => {
	const rounded = Math.round(change * 10) / 10;

	if (Object.is(rounded, -0)) {
		return 0;
	}

	return rounded;
};
