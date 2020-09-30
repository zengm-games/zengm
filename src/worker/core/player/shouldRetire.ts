import { PLAYER } from "../../../common";
import { g, random } from "../../util";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerWithoutKey,
} from "../../../common/types"; // Players meeting one of these cutoffs might retire

const shouldRetire = (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
): boolean => {
	const age = g.get("season") - p.born.year;
	const { pos } = p.ratings[p.ratings.length - 1];

	// Originally this used pot, but pot is about 1.1*value, and value is consistent in leagues with different ratings distributions
	const pot = 1.1 * p.value;

	if (process.env.SPORT === "basketball") {
		const maxAge = 33;
		const minPot = 40;

		// Only players older than maxAge or without a contract will retire
		if (age > maxAge || (pot < minPot && p.tid === PLAYER.FREE_AGENT)) {
			let ws = 0;
			for (const stats of p.stats) {
				if (stats.season === g.get("season") && !stats.playoffs) {
					ws += stats.dws + stats.ows;
				}
			}

			// Formulas from @nicidob
			const estWS = (1 / 85.017) * (Math.max(pot, 37) - 37) ** 2;
			const logit =
				-1.4134 +
				(1 / 175.19) * (Math.max(age, 18) - 18) ** 2 -
				0.971 * Math.max(ws, estWS);

			const odds = Math.exp(logit);
			const prob = odds / (1 + odds);

			if (prob > Math.random()) {
				return true;
			}
		}
	} else {
		const maxAge = pos === "QB" || pos === "P" || pos === "K" ? 33 : 29;
		const minPot = 50;

		// Only players older than maxAge or without a contract will retire
		if (age > maxAge || (pot < minPot && p.tid === PLAYER.FREE_AGENT)) {
			let excessAge = 0;

			if (age > maxAge) {
				excessAge = (age - maxAge) / 40; // 0.025 for each year beyond maxAge
			}

			const excessPot = (minPot - pot) / 50; // 0.02 for each potential rating below minPot (this can be negative)

			if (excessAge + excessPot + random.gauss(0, 1) > 0) {
				return true;
			}
		}
	}

	return false;
};

export default shouldRetire;
