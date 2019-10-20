// @flow

import { g } from "../../util";

/**
 * Get a list of rookie salaries for all players in the draft.
 *
 * By default there are 60 picks, but some are added/removed if there aren't 30 teams.
 *
 * @memberOf core.draft
 * @return {Array.<number>} Array of salaries, in thousands of dollars/year.
 */
const getRookieSalaries = (): number[] => {
	// Default for 60 picks
	const rookieSalaries = [
		5000,
		4500,
		4000,
		3500,
		3000,
		2750,
		2500,
		2250,
		2000,
		1900,
		1800,
		1700,
		1600,
		1500,
		1400,
		1300,
		1200,
		1100,
		1000,
		1000,
		1000,
		1000,
		1000,
		1000,
		1000,
		1000,
		1000,
		1000,
		1000,
		1000,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
		500,
	];

	while (g.numTeams * g.numDraftRounds > rookieSalaries.length) {
		// Add min contracts on to end
		rookieSalaries.push(500);
	}
	while (g.numTeams * g.numDraftRounds < rookieSalaries.length) {
		// Remove smallest salaries
		rookieSalaries.pop();
	}

	if (g.minContract !== 500 || g.maxContract !== 20000) {
		for (let i = 0; i < rookieSalaries.length; i++) {
			// Subtract min
			rookieSalaries[i] -= 500;

			// Scale so max will be 1/4 the max contract
			rookieSalaries[i] *= (0.25 * g.maxContract - g.minContract) / 4500;

			// Add min back
			rookieSalaries[i] += g.minContract;

			rookieSalaries[i] = Math.round(rookieSalaries[i] / 50) * 50;
		}
	}

	return rookieSalaries;
};

export default getRookieSalaries;
