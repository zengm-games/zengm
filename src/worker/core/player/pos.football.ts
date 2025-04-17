import ovr from "./ovr.football.ts";
import type { PlayerRatings } from "../../../common/types.football.ts";
import { NOT_REAL_POSITIONS, POSITIONS } from "../../../common/index.ts";

const pos = (ratings: PlayerRatings): string => {
	const positions = POSITIONS.filter(
		(pos2) => !NOT_REAL_POSITIONS.includes(pos2),
	);
	const ovrs = positions.map((position) => ovr(ratings, position));
	let ind = 0;
	let max = 0;

	for (let i = 0; i < ovrs.length; i++) {
		if (ovrs[i] > max) {
			max = ovrs[i];
			ind = i;
		}
	}

	return positions[ind];
};

export default pos;
