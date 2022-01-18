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
	const draftPickAutoContractPercent = g.get("draftPickAutoContractPercent");
	const draftPickAutoContractRounds = g.get("draftPickAutoContractRounds");

	let firstPickSalary = Math.max(
		(maxContract * draftPickAutoContractPercent) / 100,
		minContract,
	);
	if (draftPickAutoContractRounds < 1) {
		firstPickSalary = minContract;
	}

	const excessSalary = firstPickSalary - minContract;

	// First third of the first round - use up half of excessSalary. Rest of rounds within draftPickAutoContractRounds - use up the rest
	const numPlayersHighSlope = Math.round(numActiveTeams / 3);
	const numPlayersLowSlope =
		numActiveTeams * Math.min(draftPickAutoContractRounds, numDraftRounds) -
		numPlayersHighSlope;
	const numPlayersNoSlope =
		numActiveTeams * numDraftRounds - numPlayersHighSlope - numPlayersLowSlope;

	const highSlope =
		numPlayersHighSlope > 1
			? -(excessSalary / 2) / (numPlayersHighSlope - 1)
			: -(excessSalary / 2);

	// +1 is so the last pick in the round is not min contract already, but we don't want that if this is going to the last pick on the last round
	const plusOne = numDraftRounds > draftPickAutoContractRounds ? 1 : 0;
	const lowSlope =
		numPlayersLowSlope > 0
			? -(excessSalary / 2) / (numPlayersLowSlope + plusOne)
			: 0;

	const salaries = [firstPickSalary];

	for (let i = 1; i < numPlayersHighSlope; i++) {
		salaries.push(salaries.at(-1) + highSlope);
	}
	for (let i = 0; i < numPlayersLowSlope; i++) {
		salaries.push(salaries.at(-1) + lowSlope);
	}
	for (let i = 0; i < numPlayersNoSlope; i++) {
		salaries.push(minContract);
	}

	const salariesRounded = salaries.map(salary => helpers.roundContract(salary));

	return salariesRounded;
};

export default getRookieSalaries;
