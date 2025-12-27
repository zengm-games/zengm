import { g, helpers, random } from "../../util/index.ts";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerContract,
	PlayerWithoutKey,
} from "../../../common/types.ts";
import { isSport } from "../../../common/index.ts";

/**
 * Get position scarcity premium - positions that are harder to fill or more impactful
 * command higher salaries relative to their overall rating.
 */
const getPositionPremium = (pos: string, value: number): number => {
	if (isSport("basketball")) {
		// In basketball, positions are less differentiated but elite playmakers/rim protectors
		// are slightly more valuable
		if (pos === "PG" || pos === "C") {
			return value >= 70 ? 1.05 : 1.0;
		}
		return 1.0;
	}

	if (isSport("football")) {
		// QB premium is already handled, but add more nuance
		if (pos === "QB") {
			if (value >= 75) {
				return 1.25;
			} else if (value >= 50) {
				return 0.75 + ((value - 50) * 0.5) / 25;
			}
			return 0.75;
		}
		// Elite pass rushers and left tackles command premiums
		if (pos === "DE" || pos === "OLB") {
			return value >= 70 ? 1.15 : 1.0;
		}
		if (pos === "OT") {
			return value >= 70 ? 1.1 : 1.0;
		}
		// Cornerbacks are scarce
		if (pos === "CB") {
			return value >= 70 ? 1.1 : 1.0;
		}
		// Running backs are devalued in modern NFL
		if (pos === "RB") {
			return 0.85;
		}
		// Kickers and punters
		if (pos === "K" || pos === "P") {
			return 0.25;
		}
		return 1.0;
	}

	if (isSport("baseball")) {
		// Starting pitchers are highly valued
		if (pos === "SP") {
			return value >= 70 ? 1.2 : 1.05;
		}
		// Elite closers
		if (pos === "RP") {
			return value >= 75 ? 1.1 : 0.9;
		}
		// Good catchers are scarce
		if (pos === "C") {
			return value >= 65 ? 1.1 : 1.0;
		}
		// Shortstops with offense
		if (pos === "SS") {
			return value >= 70 ? 1.1 : 1.0;
		}
		// DH-only players are less valuable
		if (pos === "DH") {
			return 0.85;
		}
		return 1.0;
	}

	if (isSport("hockey")) {
		// Elite goalies command huge premiums
		if (pos === "G") {
			return value >= 70 ? 1.25 : 1.0;
		}
		// Top-pair defensemen
		if (pos === "D") {
			return value >= 70 ? 1.1 : 1.0;
		}
		// Centers are more valuable than wingers
		if (pos === "C") {
			return value >= 70 ? 1.05 : 1.0;
		}
		return 1.0;
	}

	return 1.0;
};

/**
 * Get age-based contract adjustment - older players get discounted,
 * prime-age players may get slight premiums.
 */
const getAgeAdjustment = (age: number): number => {
	if (age <= 24) {
		// Young players on rookie deals or second contracts
		return 1.0;
	}
	if (age <= 28) {
		// Prime years - slight premium
		return 1.05;
	}
	if (age <= 30) {
		// Still productive but declining
		return 1.0;
	}
	if (age <= 32) {
		// Clear decline phase
		return 0.9;
	}
	if (age <= 34) {
		// Significant discount
		return 0.8;
	}
	if (age <= 36) {
		// Major discount
		return 0.7;
	}
	// Ancient players
	return 0.6;
};

/**
 * Get injury history penalty - players with significant injury history
 * are offered less money due to risk.
 */
const getInjuryPenalty = (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
): number => {
	// Count games missed to injuries in recent seasons
	const recentSeasons = p.injuries?.slice(-3) || [];
	let totalGamesMissed = 0;

	for (const injury of recentSeasons) {
		totalGamesMissed += injury.gamesRemaining || 0;
	}

	if (totalGamesMissed === 0) {
		return 1.0; // No injury history bonus (slight premium for durability)
	}
	if (totalGamesMissed <= 10) {
		return 0.98; // Minor injuries
	}
	if (totalGamesMissed <= 30) {
		return 0.95; // Moderate injury concerns
	}
	if (totalGamesMissed <= 60) {
		return 0.9; // Significant injury history
	}
	// Major injury concerns
	return 0.85;
};

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
	const ratings = p.ratings.at(-1)!;
	let factor = g.get("salaryCapType") === "hard" ? 1.6 : 2;

	if (isSport("basketball")) {
		factor *= 1.7;
	}

	if (isSport("baseball")) {
		factor *= 1.4;
	}

	if (isSport("hockey")) {
		factor *= 1.4;
	}

	// Position-based premium (replaces old football-specific logic)
	const positionPremium = getPositionPremium(ratings.pos, p.value);

	// Age-based adjustment
	const age = g.get("season") - p.born.year;
	const ageAdjustment = getAgeAdjustment(age);

	// Injury history penalty
	const injuryPenalty = getInjuryPenalty(p);

	// Combined factor for position, age, and injury
	const factor2 = positionPremium * ageAdjustment * injuryPenalty;

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
