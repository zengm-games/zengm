import type { PlayerRatings } from "../../../common/types.basketball";

const POS_VALUES = {
	PG: 0,
	SG: 1,
	SF: 2,
	PF: 3,
	C: 4,
	G: 0.5,
	F: 2.5,
	FC: 3.5,
	GF: 1.5,
};

// Assign a position (PG, SG, SF, PF, C, G, GF, FC) based on ratings. See analysis/pos-basketball
const pos = (ratings: PlayerRatings): string => {
	const value =
		-0.922949 +
		0.073339 * ratings.hgt +
		0.009744 * ratings.stre +
		-0.002215 * ratings.spd +
		-0.005438 * ratings.jmp +
		0.003006 * ratings.endu +
		-0.003516 * ratings.ins +
		-0.008239 * ratings.dnk +
		0.001647 * ratings.ft +
		-0.001404 * ratings.fg +
		-0.004599 * ratings.tp +
		0.001407 * ratings.diq +
		0.002433 * ratings.oiq +
		-0.000753 * ratings.drb +
		-0.021888 * ratings.pss +
		0.016867 * ratings.reb;

	let minDiff = Infinity;
	let minDiffPos = "F";
	for (const [pos, posValue] of Object.entries(POS_VALUES)) {
		const diff = Math.abs(value - posValue);
		if (diff < minDiff) {
			minDiff = diff;
			minDiffPos = pos;
		}
	}

	return minDiffPos;
};

export default pos;
