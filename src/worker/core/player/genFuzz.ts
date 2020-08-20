import { g, random } from "../../util";

/**
 * Generate fuzz.
 *
 * Fuzz is random noise that is added to a player's displayed ratings, depending on the scouting budget.
 *
 * @memberOf core.player
 * @param {number} scoutingRank Between 1 and 30, the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree.
 * @return {number} Fuzz, between -5 and 5.
 */
const genFuzz = (scoutingRank: number): number => {
	const cutoff = 2 + (8 * (scoutingRank - 1)) / (g.get("numActiveTeams") - 1); // Max error is from 2 to 10, based on scouting rank

	const sigma = 1 + (2 * (scoutingRank - 1)) / (g.get("numActiveTeams") - 1); // Stddev is from 1 to 3, based on scouting rank

	let fuzz = random.gauss(0, sigma);

	if (fuzz > cutoff) {
		fuzz = cutoff;
	} else if (fuzz < -cutoff) {
		fuzz = -cutoff;
	}

	return fuzz;
};

export default genFuzz;
