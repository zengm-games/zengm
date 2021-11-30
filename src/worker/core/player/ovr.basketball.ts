import type { PlayerRatings } from "../../../common/types.basketball";

/**
 * Calculates the overall rating by averaging together all the other ratings.
 *
 * @memberOf core.player
 * @param {Object.<string, number>} ratings Player's ratings object.
 * @return {number} Overall rating.
 */
const ovr = (ratings: PlayerRatings): number => {
	// See analysis/player-ovr-basketball
	const r =
		0.208 * (ratings.hgt - 47.7) +
		0.0938 * (ratings.stre - 46.8) +
		0.154 * (ratings.spd - 50.3) +
		0.04 * (ratings.jmp - 48.3) +
		0.019 * (ratings.endu - 37.4) +
		0.0238 * (ratings.ins - 39.9) +
		0.0287 * (ratings.dnk - 45.8) +
		0.021 * (ratings.ft - 42.9) +
		0.01 * (ratings.fg - 42.9) +
		0.121 * (ratings.tp - 43.0) +
		0.092 * (ratings.oiq - 41.3) +
		0.0924 * (ratings.diq - 42.1) +
		0.0903 * (ratings.drb - 50.5) +
		0.0971 * (ratings.pss - 47.3) +
		0.01 * (ratings.reb - 48.4) +
		45.4;

	// Fudge factor to keep ovr ratings the same as they used to be (back before 2018 ratings rescaling)
	// +8 at 68
	// +4 at 50
	// -5 at 42
	// -10 at 31
	let fudgeFactor = 0;
	if (r >= 68) {
		fudgeFactor = 8;
	} else if (r >= 50) {
		fudgeFactor = 4 + (r - 50) * (4 / 18);
	} else if (r >= 42) {
		fudgeFactor = -5 + (r - 42) * (9 / 8);
	} else if (r >= 31) {
		fudgeFactor = -5 - (42 - r) * (5 / 11);
	} else {
		fudgeFactor = -10;
	}

	const val = Math.round(r + fudgeFactor);

	if (val > 100) {
		return 100;
	}
	if (val < 0) {
		return 0;
	}

	return val;
};

export default ovr;
