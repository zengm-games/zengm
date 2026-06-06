import type { CoachRatings } from "../../../common/types.ts";

// Weighted overall coach rating. Development and tactics are the most impactful,
// so they're weighted highest.
const ovr = (ratings: Omit<CoachRatings, "ovr">): number => {
	return Math.round(
		0.3 * ratings.development +
			0.3 * ratings.tactics +
			0.2 * ratings.adaptability +
			0.2 * ratings.motivation,
	);
};

export default ovr;
