import ovr from "./ovr.baseball";
import type { PlayerRatings } from "../../../common/types.baseball";
import { bySport, POSITIONS } from "../../../common";

export const BANNED_POSITIONS = bySport({
	baseball: ["DH"],
	basketball: [],
	football: ["KR", "PR"],
	hockey: [],
});

const pos = (ratings: PlayerRatings): string => {
	const ovrs = POSITIONS.map(position => ovr(ratings, position));
	let ind = 0;
	let max = 0;

	for (let i = 0; i < ovrs.length; i++) {
		if (!BANNED_POSITIONS.includes(POSITIONS[i]) && ovrs[i] > max) {
			max = ovrs[i];
			ind = i;
		}
	}

	return POSITIONS[ind];
};

export default pos;
