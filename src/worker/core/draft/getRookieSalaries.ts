import { isSport } from "../../../common";
import { g, helpers } from "../../util";

/**
 * Get a list of rookie salaries for all players in the draft.
 *
 * By default there are 60 picks, but some are added/removed if there aren't 30 teams.
 *
 * @memberOf core.draft
 * @return {Array.<number>} Array of salaries, in thousands of dollars/year.
 */
const getRookieSalaries = (): number[] => {
	const numActiveTeams = g.get("numActiveTeams");
	const numDraftRounds = g.get("numDraftRounds");

	if (numActiveTeams === 0 || numDraftRounds === 0) {
		return [];
	}

	const minContract = g.get("minContract");
	const maxContract = g.get("maxContract");

	if (isSport("hockey")) {
		const earlySalary = Math.min(2 * minContract, maxContract);
		const lateSalary = minContract;

		const salaries = [];

		for (let i = 0; i < numActiveTeams * numDraftRounds; i++) {
			if (i < (numActiveTeams * numDraftRounds) / 2) {
				salaries.push(earlySalary);
			} else {
				salaries.push(lateSalary);
			}
		}

		return salaries;
	}

	// Default for first round
	const firstRoundRookieSalaries = [
		5000, 4500, 4000, 3500, 3000, 2750, 2500, 2250, 2000, 1900, 1800, 1700,
		1600, 1500, 1400, 1300, 1200, 1100, 1000, 1000, 1000, 1000, 1000, 1000,
		1000, 1000, 1000, 1000, 1000, 1000,
	];

	// Default for all subsequent rounds
	const otherRoundRookieSalaries = [
		500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500,
		500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500,
	];

	while (numActiveTeams > firstRoundRookieSalaries.length) {
		//add first round contracts on to end of first round
		firstRoundRookieSalaries.push(1000);
	}

	while (numActiveTeams < firstRoundRookieSalaries.length) {
		//remove smallest first round salaries
		firstRoundRookieSalaries.pop();
	}

	while (
		numActiveTeams * (numDraftRounds - 1) >
		otherRoundRookieSalaries.length
	) {
		// Add min contracts on to end
		otherRoundRookieSalaries.push(500);
	}

	while (
		numActiveTeams * (numDraftRounds - 1) <
		otherRoundRookieSalaries.length
	) {
		// Remove smallest salaries
		otherRoundRookieSalaries.pop();
	}

	// Combine first round and other rounds
	const rookieSalaries = firstRoundRookieSalaries.concat(
		otherRoundRookieSalaries,
	);

	if (minContract !== 500 || maxContract !== 20000) {
		for (let i = 0; i < rookieSalaries.length; i++) {
			// Subtract min
			rookieSalaries[i] -= 500;

			// Scale so max will be 1/4 the max contract
			rookieSalaries[i] *= (0.25 * maxContract - minContract) / 4500;

			// Add min back
			rookieSalaries[i] += minContract;
			rookieSalaries[i] = helpers.roundContract(rookieSalaries[i]);

			rookieSalaries[i] = helpers.bound(
				rookieSalaries[i],
				minContract,
				maxContract,
			);
		}
	}

	return rookieSalaries;
};

export default getRookieSalaries;
