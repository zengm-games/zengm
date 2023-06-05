import { g, random } from "../../util";

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
