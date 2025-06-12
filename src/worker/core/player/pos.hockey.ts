import ovr from "./ovr.hockey.ts";
import type { PlayerRatings } from "../../../common/types.hockey.ts";
import { POSITIONS } from "../../../common/index.ts";

const pos = (ratings: PlayerRatings): string => {
	const ovrs = POSITIONS.map((position) => ovr(ratings, position));
	let ind = 0;
	let max = 0;

	for (const [i, ovr] of ovrs.entries()) {
		if (ovr > max) {
			max = ovr;
			ind = i;
		}
	}

	return POSITIONS[ind];
};

export default pos;
