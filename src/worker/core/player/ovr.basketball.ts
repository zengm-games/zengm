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
		0.0935 * ratings.diq +
		0.042 * ratings.dnk +
		0.0969 * ratings.drb +
		0.00725 * ratings.endu +
		-0.00948 * ratings.fg +
		0.0488 * ratings.ft +
		0.225 * ratings.hgt +
		-0.0143 * ratings.ins +
		0.0502 * ratings.jmp +
		0.0974 * ratings.oiq +
		0.0656 * ratings.pss +
		0.0533 * ratings.reb +
		0.156 * ratings.spd +
		0.0962 * ratings.stre +
		0.105 * ratings.tp +
		-6.4;

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
