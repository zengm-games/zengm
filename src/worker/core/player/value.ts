import fuzzRating from "./fuzzRating";
import { g } from "../../util";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerWithoutKey,
} from "../../../common/types";
import valueCombineOvrPot from "./valueCombineOvrPot";
import { bySport, isSport } from "../../../common";

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

	// Normalize ovr/pot, these are values for a typical random players league
	const defaultOvrMean = bySport({
		baseball: 47,
		basketball: 47,
		football: 48,
		hockey: 50,
	});
	const defaultOvrStd = bySport({
		baseball: 11,
		basketball: 10,
		football: 11,
		hockey: 11,
	});
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

	// 1. Account for stats (and current ratings if not enough stats)
	const ps = p.stats.filter(playerStats => !playerStats.playoffs);
	let current = pr.ovr;

	// No stats at all? Just look at ratings more, then.
	if (isSport("basketball") && ps.length > 0) {
		const ps1 = ps.at(-1); // Most recent stats

		// weights and values for the last few years
		// this is a prior
		let m0 = 2000;
		let v0 = pr.ovr;

		let m1 = 0;
		let v1 = 0;
		const w1 = 1;

		let m2 = 0;
		let v2 = 0;
		const w2 = 0.1;

		// PER may be undefined for exhibition game players from old historical seasons. See ps2 check below too.
		if (Object.hasOwn(ps1, "sovr")) {
			if (ps.length >= 1 && ps1.sovr > 0) {
				// Only one year of stats
				v1 = ps1.sovr;
				m1 = w1 * ps1.min;
				//console.log("ONE YEAR");
			}
			if (ps.length >= 2) {
				// Two most recent seasons
				const ps2 = ps[ps.length - 2];

				if (Object.hasOwn(ps2, "sovr") && ps2.sovr > 0) {
					v2 = ps2.sovr;
					m2 = w2 * ps2.min;
					//console.log("TWO YEAR");
				}
			}
			const total_w = m0 + m1 + m2;
			current = (m0 / total_w) * v0 + (m1 / total_w) * v1 + (m2 / total_w) * v2;
		}
	}

	// 2. Potential
	let potential = pr.pot;

	if (isSport("football")) {
		if (pr.pos === "QB") {
			current *= 1.1;
			potential *= 1.1;
		} else if (pr.pos === "K" || pr.pos === "P") {
			current *= 0.65;
			potential *= 0.65;
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
	const combined = valueCombineOvrPot(current, potential, age);

	return combined < 0 ? Number.MIN_VALUE : combined;
};

export default value;
