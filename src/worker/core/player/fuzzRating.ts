import { PHASE } from "../../../common";
import { g, helpers } from "../../util";

// Generate plus minus from ovr
const getO2PM = (ovr: number) => {
	const iv = [72.7, 7.28 * 2, 18.1 / 2];
	const minVal = -2.021381747657189;
	return minVal + iv[1] / (1 + Math.exp(-(ovr - iv[0]) / iv[2]));
};
// get ovr from plus minus
const getPM2O = (pm: number) => {
	const iv = [72.7, 7.28 * 2, 18.1 / 2];
	const minVal = -2.021381747657189;
	//clip plus minus, don't send players to 0 lol
	const pmC = Math.min(iv[1] + minVal, Math.max(minVal + 0.11, pm));
	// invert the sigmoid above
	const ovr = iv[0] - iv[2] * Math.log(iv[1] / (pmC - minVal) - 1);
	// clip overall
	const ovrC = Math.min(100, Math.max(0, ovr));

	return ovrC;
};

const fuzzRating = (rating: number, fuzz: number, isDraft = false): number => {
	// Turn off fuzz in multi team mode, because it doesn't have any meaning there in its current form. The check for
	// existence of variables is because this is sometimes called in league upgrade code when g is not available and
	// would be difficult to make available due to Firefox promise/IDB/worker issues.
	if (
		(Object.hasOwn(g, "userTids") && g.get("userTids").length > 1) ||
		(Object.hasOwn(g, "godMode") && g.get("godMode"))
	) {
		return rating;
	}

	let frac_left = 1;

	// this shouldn't happen for draft prospects.
	if (!isDraft) {
		// would love to use number of days;
		//const numDays = season.getDaysLeftSchedule();
		//const numTotal = g.get("numGames");

		frac_left = g.get("phase") >= PHASE.PLAYOFFS ? 0 : 1;
	}

	// fuzz is -5 to 5. Let's assume it's really -1 to 1 in +/- terms
	const fuzzed = getPM2O(getO2PM(rating) + (frac_left * fuzz) / 5);

	return Math.round(helpers.bound(fuzzed, 0, 100));
};

export default fuzzRating;
