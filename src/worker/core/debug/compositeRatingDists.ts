import { COMPOSITE_WEIGHTS, PLAYER } from "../../../common/constants.ts";
import { player } from "../index.ts";
import { idb } from "../../db/index.ts";
import { last } from "../../../common/utils.ts";

const compositeRatingDists = async () => {
	// All non-retired players
	const players = await idb.league
		.transaction("players")
		.store.index("tid")
		.getAll(IDBKeyRange.lowerBound(PLAYER.FREE_AGENT));
	const compositeRatings = players
		.map((p) => {
			return player.compositeRating(
				last(p.ratings),
				COMPOSITE_WEIGHTS.shootingThreePointer!.ratings,
				COMPOSITE_WEIGHTS.shootingThreePointer!.weights,
				false,
			);
		})
		.sort((a, b) => b - a);
	console.log(compositeRatings);
};

export default compositeRatingDists;
