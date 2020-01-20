// @flow

import fuzzRating from "./fuzzRating";
import { g } from "../../util";
//import player from "./index";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerWithoutPid,
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
	p: Player<MinimalPlayerRatings> | PlayerWithoutPid<MinimalPlayerRatings>,
	options: {
		fuzz?: boolean,
		noPot?: boolean,
		withContract?: boolean, // is this used? I don't believe so
	} = {},
): number => {
	options.noPot = !!options.noPot;
	options.fuzz = !!options.fuzz;
	options.withContract = !!options.withContract;

	// Current ratings
	const pr = {}; // Start blank, add what we need (efficiency, wow!)
	const s = p.ratings.length - 1; // Latest season

	// Fuzz?
	pr.pos = p.ratings[s].pos; //do we need this
	if (options.fuzz) {
		pr.ovr = fuzzRating(p.ratings[s].ovr, p.ratings[s].fuzz);
		pr.pot = fuzzRating(p.ratings[s].pot, p.ratings[s].fuzz);
	} else {
		pr.ovr = p.ratings[s].ovr;
		pr.pot = p.ratings[s].pot;
	}

	// From linear regression OVR ~ PER
	const slope = 1.531;
	const intercept = 31.693;

	// 1. OVERALL RATINGS + PER + CONSISTENCY
	// Account for stats (and current ratings if not enough stats)
	const ps = p.stats.filter(playerStats => !playerStats.playoffs);
	let current = pr.ovr; // No stats at all? Just look at ratings more, then.
	if (process.env.SPORT === "basketball" && ps.length > 0) {
		const ps1 = ps[ps.length - 1]; // Most recent stats
		let PER2OVR;
		if (ps.length === 1) {
			// Only one year of stats
			PER2OVR = intercept + ps1.per * slope;
			if (ps1.min > 14 * ps1.gp) {
				//high mpg
				current = 0.6 * current + 0.4 * PER2OVR;
			} else {
				//low mpg
				current = 0.875 * current + 0.125 * PER2OVR;
			}
		} else {
			const ps2 = ps[ps.length - 2]; // Two most recent seasons
			PER2OVR =
				intercept +
				((ps1.per * ps1.min + ps2.per * ps2.min) / (ps1.min + ps2.min)) * slope;
			if (ps1.min + ps2.min > 1250) {
				//if they've played significant minutes
				current = 0.6 * current + 0.4 * PER2OVR;
			} else {
				current = 0.875 * current + 0.125 * PER2OVR;
			}
		}
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
	if (p.draft.year > g.season) {
		// Draft prospect
		age = p.draft.year - p.born.year;
	} else {
		age = g.season - p.born.year;
	}

	// Otherwise, combine based on age
	if (age === 19) {
		return 0.75 * potential + 0.25 * current;
	}
	if (age === 20) {
		return 0.7 * potential + 0.3 * current;
	}
	if (age === 21) {
		return 0.65 * potential + 0.35 * current;
	}
	if (age === 22) {
		return 0.6 * potential + 0.4 * current;
	}
	if (age === 23) {
		return 0.55 * potential + 0.45 * current;
	}
	if (age === 24) {
		return 0.5 * potential + 0.5 * current;
	}
	if (age === 25) {
		return 0.4 * potential + 0.6 * current;
	}
	if (age === 26) {
		return 0.3 * potential + 0.7 * current;
	}
	if (age === 27) {
		return 0.2 * potential + 0.8 * current;
	}
	if (age === 28) {
		return 0.1 * potential + 0.9 * current;
	}
	if (age === 29) {
		return current; //peak
	}
	if (age === 30) {
		return current; //peak
	}
	if (age === 31) {
		return current; //peak
	}
	if (age === 32) {
		return 0.975 * current;
	}
	if (age === 33) {
		return 0.95 * current;
	}
	const ageFactor = 0.9 - 0.05 * (age - 34);
	return ageFactor * current; //final case --> age >= 34
};

export default value;
