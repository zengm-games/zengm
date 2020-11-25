import fuzzRating from "./fuzzRating";
import { g } from "../../util";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerWithoutKey,
} from "../../../common/types";

/**
 * Returns a numeric value for a given player, representing is general worth to a typical team
 * (i.e. ignoring how well he fits in with his teammates and the team's strategy/finances). It
 * is similar in scale to the overall and potential ratings of players (0-100), but it is based
 * on stats in addition to ratings. The main components are:
 *
 * 1. Recent stats: Avg of last 2 seasons' PER if min > 2000. Otherwise, scale by min / 2000 and
 *     use ratings to estimate the rest.
 * 2. Potential for improvement (or risk for decline): Based on age and potential rating.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @param {Object=} options Object containing several optional options:
 *     noPot: When true, don't include potential in the value calcuation (useful for roster
 *         ordering and game simulation). Default false.
 *     fuzz: When true, used fuzzed ratings (useful for roster ordering, draft prospect
 *         ordering). Default false.
 * @return {number} Value of the player, usually between 50 and 100 like overall and potential
 *     ratings.
 */
const value = (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
	options: {
		fuzz?: boolean;
		noPot?: boolean;
		ovrMean: number;
		ovrStd: number;
	},
): number => {
	options.noPot = !!options.noPot;
	options.fuzz = !!options.fuzz;

	// Current ratings
	const pr: any = {}; // Start blank, add what we need

	const s = p.ratings.length - 1;

	// Latest season
	pr.pos = p.ratings[s].pos;

	// Fuzz?
	if (options.fuzz) {
		pr.ovr = fuzzRating(p.ratings[s].ovr, p.ratings[s].fuzz);
		pr.pot = fuzzRating(p.ratings[s].pot, p.ratings[s].fuzz);
	} else {
		pr.ovr = p.ratings[s].ovr;
		pr.pot = p.ratings[s].pot;
	}

	// Normalize ovr/pot, other sports need testing
	if (process.env.SPORT === "basketball") {
		const defaultOvrMean = 47;
		const defaultOvrStd = 10;
		if (options.ovrStd > 0) {
			pr.ovr =
				((pr.ovr - options.ovrMean) / options.ovrStd) * defaultOvrStd +
				defaultOvrMean;
			pr.pot =
				((pr.pot - options.ovrMean) / options.ovrStd) * defaultOvrStd +
				defaultOvrMean;
		} else {
			pr.ovr = pr.ovr - options.ovrMean + defaultOvrMean;
			pr.pot = pr.pot - options.ovrMean + defaultOvrMean;
		}
	}

	// From linear regression OVR ~ PER
	const slope = 1.531;
	const intercept = 31.693;

	// 1. Account for stats (and current ratings if not enough stats)
	const ps = p.stats.filter(playerStats => !playerStats.playoffs);
	let current = pr.ovr;

	// No stats at all? Just look at ratings more, then.
	if (process.env.SPORT === "basketball" && ps.length > 0) {
		const ps1 = ps[ps.length - 1]; // Most recent stats

		if (ps.length === 1 || ps[0].min >= 2000) {
			// Only one year of stats
			current = intercept + slope * ps1.per;

			if (ps1.min < 2000) {
				current = (current * ps1.min) / 2000 + pr.ovr * (1 - ps1.min / 2000);
			}
		} else {
			// Two most recent seasons
			const ps2 = ps[ps.length - 2];

			if (ps1.min + ps2.min > 0) {
				current =
					intercept +
					(slope * (ps1.per * ps1.min + ps2.per * ps2.min)) /
						(ps1.min + ps2.min);

				if (ps1.min + ps2.min < 2000) {
					current =
						(current * (ps1.min + ps2.min)) / 2000 +
						pr.ovr * (1 - (ps1.min + ps2.min) / 2000);
				}
			}
		}

		current = 0.8 * pr.ovr + 0.2 * current; // Include some part of the ratings
	}

	// 2. Potential
	let potential = pr.pot;

	if (process.env.SPORT === "football") {
		if (pr.pos === "QB") {
			current *= 1.25;
			potential *= 1.25;
		} else if (pr.pos === "K" || pr.pos === "P") {
			current *= 0.25;
			potential *= 0.25;
		}
	}

	// Short circuit if we don't care about potential
	if (options.noPot) {
		return current;
	}

	// If performance is already exceeding predicted potential, just use that
	if (current >= potential) {
		potential = current;
	}

	let age;

	if (p.draft.year > g.get("season")) {
		// Draft prospect
		age = p.draft.year - p.born.year;
	} else {
		age = g.get("season") - p.born.year;
	}

	// Otherwise, combine based on age
	// Coefficients influenced by analysis from nicidob:
	// "I built my little statistical OVR measure. Then grouped by age. And got the average sOVR for the following 4 player years. Then just did a regression tree from [pot, ovr] (if both exist) to see how to get that sOVR"
	if (age <= 19) {
		return 0.7 * potential + 0.3 * current;
	}

	if (age <= 20) {
		return 0.65 * potential + 0.35 * current;
	}

	if (age <= 21) {
		return 0.6 * potential + 0.4 * current;
	}

	if (age <= 22) {
		return 0.6 * potential + 0.4 * current;
	}

	if (age <= 23) {
		return 0.55 * potential + 0.45 * current;
	}

	if (age <= 24) {
		return 0.45 * potential + 0.55 * current;
	}

	if (age <= 25) {
		return 0.3 * potential + 0.7 * current;
	}

	if (age <= 26) {
		return 0.15 * potential + 0.85 * current;
	}

	if (age <= 27) {
		return 0.025 * potential + 0.95 * current;
	}

	if (age <= 28) {
		return 0.95 * current;
	}

	if (age <= 29) {
		return 0.94 * current;
	}

	if (age <= 30) {
		return 0.93 * current;
	}

	if (age <= 33) {
		return 0.92 * current;
	}

	if (age <= 38) {
		return 0.91 * current;
	}

	return 0.9 * current;
};

export default value;
