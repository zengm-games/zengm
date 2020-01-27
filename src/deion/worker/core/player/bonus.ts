import limitRating from "./limitRating";
import { random } from "../../util";
import { PlayerWithoutKey } from "../../../common/types";

const bonus = (p: PlayerWithoutKey) => {
	const ratings = p.ratings[p.ratings.length - 1];
	const skip = ["fuzz", "ovr", "pos", "pot", "season", "skills"];

	for (const key of Object.keys(ratings)) {
		if (skip.includes(key) || typeof ratings[key] !== "number") {
			continue;
		}

		ratings[key] = limitRating(ratings[key] + random.randInt(0, 10));
	}
};

export default bonus;
