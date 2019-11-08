// @flow

import { helpers } from "../../../../deion/worker/util";
import type { PlayerRatings } from "../../../common/types";

/**
 * Calculates the overall rating by averaging together all the other ratings.
 *
 * @memberOf core.player
 * @param {Object.<string, number>} ratings Player's ratings object.
 * @return {number} Overall rating.
 */
const ovr = (ratings: PlayerRatings): number => {
	// This formula is loosely based on linear regression of zscore(ratings) to +/- per minute:
	const r =
		0.265 * (ratings.hgt - 47.5) +
		0.129 * (ratings.stre - 50.2) +
		0.205 * (ratings.spd - 50.8) +
		0.085 * (ratings.jmp - 48.7) +
		0.105 * (ratings.endu - 39.9) +
		0.0211 * (ratings.ins - 42.4) +
		0.0476 * (ratings.dnk - 49.5) +
		0.0336 * (ratings.ft - 47.0) +
		0.121 * (ratings.tp - 47.1) +
		0.222 * (ratings.oiq - 46.8) +
		0.264 * (ratings.diq - 46.7) +
		0.0983 * (ratings.drb - 54.8) +
		0.103 * (ratings.pss - 51.3) +
		0.02 * (ratings.fg - 47.0) +
		0.02 * (ratings.reb - 51.4) +
		49.4;

	return helpers.bound(Math.round(r), 0, 100);
};

export default ovr;
