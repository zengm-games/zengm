import genFuzz from "./genFuzz.ts";
import { g } from "../../util/index.ts";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerWithoutKey,
} from "../../../common/types.ts";

const addRatingsRow = (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
	scoutingLevel?: number,
	injuryIndex?: number,
) => {
	const newRatings: MinimalPlayerRatings = {
		...p.ratings.at(-1)!,
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
