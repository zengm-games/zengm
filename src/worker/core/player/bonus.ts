import limitRating from "./limitRating.ts";
import { random } from "../../util/index.ts";
import type { PlayerWithoutKey } from "../../../common/types.ts";
import { RATINGS } from "../../../common/constants.ts";

const bonus = (p: PlayerWithoutKey, amount?: number) => {
	const ratings = p.ratings.at(-1) as any;

	for (const key of RATINGS) {
		const boost = amount ?? random.randInt(0, 10);
		ratings[key] = limitRating(ratings[key] + boost);
	}
};

export default bonus;
