import { g } from "../../util";

/**
 * Get contract amount adjusted for mood.
 *
 * @memberOf core.freeAgents
 * @param {number} amount Contract amount, in thousands of dollars or millions of dollars (fun auto-detect!).
 * @param {number} mood Player mood towards a team, from 0 (happy) to 1 (angry).
 * @return {number} Contract amoung adjusted for mood.
 */
const amountWithMood = (amount: number, mood: number = 0.5): number => {
	amount *= 1 + 0.2 * mood;

	if (amount >= g.get("minContract")) {
		// Must be in thousands of dollars

		if (amount > g.get("maxContract")) {
			amount = g.get("maxContract");
		}

		return 50 * Math.round(amount / 50); // Make it a multiple of 50k
	}

	// Must be in millions of dollars

	if (amount > g.get("maxContract") / 1000) {
		amount = g.get("maxContract") / 1000;
	}

	return 0.05 * Math.round(amount / 0.05); // Make it a multiple of 50k
};

export default amountWithMood;
