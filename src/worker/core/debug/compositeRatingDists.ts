import { COMPOSITE_WEIGHTS, PLAYER } from "../../../common";
import { player } from "..";
import { idb } from "../../db";

const compositeRatingDists = async () => {
	// All non-retired players
	const players = await idb.league
		.transaction("players")
		.store.index("tid")
		.getAll(IDBKeyRange.lowerBound(PLAYER.FREE_AGENT));
	const compositeRatings = players
		.map(p => {
			return player.compositeRating(
				p.ratings.at(-1),
				COMPOSITE_WEIGHTS.shootingThreePointer.ratings,
				COMPOSITE_WEIGHTS.shootingThreePointer.weights,
				false,
			);
		})
		.sort((a, b) => b - a);
	console.log(compositeRatings);
};

export default compositeRatingDists;
