import { g, helpers, random } from "../../util";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerContract,
	PlayerWithoutKey,
} from "../../../common/types";
import { isSport } from "../../../common";

/**
 * Generate a contract for a player.
 *
 * @memberOf core.player
 * @param {Object} ratings Player object. At a minimum, this must have one entry in the ratings array.
 * @param {boolean} randomizeExp If true, then it is assumed that some random amount of years has elapsed since the contract was signed, thus decreasing the expiration date. This is used when generating players in a new league.
 * @return {Object.<string, number>} Object containing two properties with integer values, "amount" with the contract amount in thousands of dollars and "exp" with the contract expiration year.
 */
const genContract = (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
	randomizeAmount: boolean = true,
	noLimit: boolean = false,
): PlayerContract => {
	const ratings = p.ratings.at(-1);
	let factor = g.get("salaryCapType") === "hard" ? 1.6 : 2;
	let factor2 = 1;

	if (isSport("basketball")) {
		factor *= 3.4 / 2;
	}

	if (isSport("football")) {
		if (ratings.pos === "QB") {
			if (p.value >= 75) {
				factor2 *= 1.25;
			} else if (p.value >= 50) {
				factor2 *= 0.75 + ((p.value - 50) * 0.5) / 25;
			}
		} else if (ratings.pos === "K" || ratings.pos === "P") {
			factor *= 0.25;
		}
	}

	let amount =
		((factor2 * p.value) / 100 - 0.47) *
			factor *
			(g.get("maxContract") - g.get("minContract")) +
		g.get("minContract");

	if (randomizeAmount) {
		amount *= helpers.bound(random.realGauss(1, 0.1), 0, 2); // Randomize
	}

	if (!noLimit) {
		if (amount < g.get("minContract") * 1.1) {
			amount = g.get("minContract");
		} else if (amount > g.get("maxContract")) {
			amount = g.get("maxContract");
		}
	} else if (amount < 0) {
		// Well, at least keep it positive
		amount = 0;
	}

	amount = helpers.roundContract(amount);

	return {
		amount,
		exp: g.get("season"),
	};
};

export default genContract;
