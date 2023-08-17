import { bySport, isSport, PLAYER } from "../../../common";
import { g, random } from "../../util";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerWithoutKey,
} from "../../../common/types"; // Players meeting one of these cutoffs might retire

const shouldRetire = (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
): boolean => {
  
	const season = g.get("season");
	const originalSeason = g.get("startingSeason");
	const forceRetireAge = g.get("forceRetireAge");
	const forceRetireSeason = g.get("forceRetireSeason");

	const age = season - p.born.year;

	if (forceRetireAge >= g.get("draftAges")[1] && age >= forceRetireAge) {
		return true;
	}

	//check how many unique seasons the player has played in
	const seasonArray = new Array(season - originalSeason).fill(0);
	p.stats.forEach(item => {
		if (seasonArray[item.year - originalSeason] == 0) {
			uniqueSeasons++;
		}
		seasonArray[item.year - originalSeason]++;
	});

	//if the player has played less unique seasons than the force retire number give them 1 more
	//season of eligibility
	let redshirt = 0;
	if (uniqueSeasons < forceRetireSeason && originalSeason < p.draft.year) {
		redshirt = 1;
	}

	if (season - p.draft.year - redshirt >= forceRetireSeason) {
		return true;
	}

	if (age < g.get("minRetireAge")) {
		return false;
	}

	const { ovr, pos } = p.ratings.at(-1)!;

	// Originally this used pot, but pot is about 1.1*value, and value is consistent in leagues with different ratings distributions
	const pot = 1.1 * p.value;

	if (isSport("basketball")) {
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

			// Second condition, for aging stars who are still pretty good, but clearly past their prime
			if (age > maxAge) {
				const maxOvr = Math.max(...p.ratings.map(row => row.ovr));
				const ovrFraction = ovr / maxOvr;
				if (ovrFraction < 0.7) {
					const prob2 = 0.2 + (0.7 - ovrFraction);
					if (prob2 > Math.random()) {
						return true;
					}
				}
			}
		}
	} else {
		const maxAge = bySport({
			baseball: 36,
			basketball: 0,
			football: pos === "QB" || pos === "P" || pos === "K" ? 35 : 32,
			hockey: 36,
		});
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
