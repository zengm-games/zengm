import limitRating from "./limitRating.ts";
import type { PlayerWithoutKey } from "../../../common/types.ts";
import { RATINGS } from "../../../common/constants.ts";
import { randInt } from "../../../common/random.ts";

const bonus = (p: PlayerWithoutKey, amount?: number) => {
	const ratings = p.ratings.at(-1) as any;

	for (const key of RATINGS) {
		const boost = amount ?? randInt(0, 10);
		ratings[key] = limitRating(ratings[key] + boost);
	}
};

export default bonus;
