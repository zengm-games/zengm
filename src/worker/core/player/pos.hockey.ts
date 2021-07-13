import ovr from "./ovr.hockey";
import type { PlayerRatings } from "../../../common/types.hockey";
import { POSITIONS } from "../../../common";

const pos = (ratings: PlayerRatings): string => {
	const ovrs = POSITIONS.map(position => ovr(ratings, position));
	let ind = 0;
	let max = 0;

	for (let i = 0; i < ovrs.length; i++) {
		if (ovrs[i] > max) {
			max = ovrs[i];
			ind = i;
		}
	}

	return POSITIONS[ind];
};

export default pos;
