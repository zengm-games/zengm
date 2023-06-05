import genFuzz from "./genFuzz";
import { g } from "../../util";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerWithoutKey,
} from "../../../common/types";

/**
 * Add a new row of ratings to a player object.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @param {number} scoutingLevel Between 1 and g.get("numActiveTeams") (default 30), the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree.
 */
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
