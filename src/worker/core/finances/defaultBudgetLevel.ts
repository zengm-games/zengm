import { BUDGET_LEVEL_SCALE, MAX_LEVEL } from "../../../common/budgetLevels";
import { g, helpers, random } from "../../util";

// Inverse of levelToEffect
export const effectToLevel = (effect: number) => {
	const x =
		effect > 0
			? Math.atanh(effect / BUDGET_LEVEL_SCALE)
			: effect / BUDGET_LEVEL_SCALE;
	return helpers.bound(
		Math.round(((x + 1) * (MAX_LEVEL - 1)) / 3 + 1),
		1,
		MAX_LEVEL,
	);
};

const defaultBudgetLevel = (popRank: number) => {
	// Scale popRank to between 1.1 and -1.1
	const scaledRank =
		BUDGET_LEVEL_SCALE *
		((2 * (g.get("numActiveTeams") - popRank)) / (g.get("numActiveTeams") - 1) -
			1);

	// Add some randomness, 0.95 mean is so it doesn't overshoot the limits and get bounded too much
	const scaledRank2 = scaledRank * random.gauss(0.95, 0.2);

	// 0.98 factor is so the level doesn't blow up to infinity by hitting the limit exactly
	const scaledRank3 = helpers.bound(
		scaledRank2,
		-BUDGET_LEVEL_SCALE * 0.98,
		BUDGET_LEVEL_SCALE * 0.98,
	);

	const level = effectToLevel(scaledRank3);

	return level;
};

export default defaultBudgetLevel;
