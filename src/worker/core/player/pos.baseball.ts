import ovr from "./ovr.baseball.ts";
import type { PlayerRatings } from "../../../common/types.baseball.ts";
import { NOT_REAL_POSITIONS, POSITIONS } from "../../../common/index.ts";

const pos = (ratings: PlayerRatings): string => {
	const ovrs = POSITIONS.map((position) => ovr(ratings, position));
	let ind = 0;
	let max = 0;

	for (const [i, ovr] of ovrs.entries()) {
		if (!NOT_REAL_POSITIONS.includes(POSITIONS[i]) && ovr > max) {
			max = ovr;
			ind = i;
		}
	}

	return POSITIONS[ind];
};

export default pos;
