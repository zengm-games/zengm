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

	const round = (num, digitsAfterDecimal) => {
		const power = 10 ** digitsAfterDecimal;
		num *= power;
		num = Math.round(num);
		return num / power;
	};

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
		if (ps.length === 1) {
			// Only one year of stats
			if (ps1.min > 14 * ps1.gp) {
				//high mpg
				current = 0.6 * current + 0.4 * ps1.per;
			} else {
				//low mpg
				current = 0.875 * current + 0.125 * ps1.per;
			}
		} else {
			const ps2 = ps[ps.length - 2]; // Two most recent seasons
			const PER2OVR =
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

	/*
	//lets value differently for w/ contract vs w/o
	if(options.withContract){
		p.worth = player.genContract(p, false, false, true); //do we want to add this to the player anyway? Where else do we need this
		const getContractValue = (playerWorth,playerContract) => {
			return (50/(g.maxContract - g.minContract))*(playerWorth-playerContract)+50; 
			//if the player is paid his worth --> his contract has nuetral or 50 value
			//if the player is paid more than his worth --> his contract has negative or less than 50 value
			// vice versa for a player paid less than his worth
		}
		const contractValue = getContractValue(p.worth.amount,p.contract.amount);
		current = .7*current + .3*contractValue;
		//current contract effects current value, not future value, so don't worry about potential
	}
	*/

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
		return round(current, 2);
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
	if (age >= 19 && age <= 24) {
		//the player is young and have time for development
		const factor = -0.05 * age + 1.7; //when 19, .75 of your value is potential based; when 24, .5 of your value is potential based
		return round(potential * factor + current * (1 - factor), 2);
	}
	if (age > 24 && age <= 29) {
		//the player is in their prime
		const factor = -0.1 * age + 2.9; //when 25 .4 of your value is potential based; when 29, 0 of your value is potential based
		return round(potential * factor + current * (1 - factor), 2);
	}
	const factor = -0.025 * age + 1.725; //as you get older... your value decreases and is soley based on overall
	return round(current * factor, 2);
};

export default value;
