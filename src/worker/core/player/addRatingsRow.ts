import genFuzz from "./genFuzz.ts";
import { g } from "../../util/index.ts";
import type {
	MinimalPlayerRatings,
	PlayerWithoutKey,
} from "../../../common/types.ts";
import { last } from "../../../common/utils.ts";

const addRatingsRow = (
	p: PlayerWithoutKey,
	scoutingLevel?: number,
	injuryIndex?: number,
) => {
	const newRatings: MinimalPlayerRatings = {
		...last(p.ratings),
		season: g.get("season"),
		injuryIndex: undefined,
	};

	if (scoutingLevel !== undefined) {
		newRatings.fuzz = (newRatings.fuzz + genFuzz(scoutingLevel)) / 2;
	}

	if (injuryIndex !== undefined) {
		newRatings.injuryIndex = injuryIndex;
	}

	p.ratings.push(newRatings);
};

export default addRatingsRow;
