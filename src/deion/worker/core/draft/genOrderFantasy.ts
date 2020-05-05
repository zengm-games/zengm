import { idb } from "../../db";
import { g } from "../../util";

const genOrderFantasy = async (
	tids: number[],
	season: "fantasy" | "expansion" = "fantasy",
) => {
	// Set total draft order, snaking picks each round
	for (let round = 1; round <= g.get("minRosterSize"); round++) {
		for (let i = 0; i < tids.length; i++) {
			await idb.cache.draftPicks.add({
				tid: tids[i],
				originalTid: tids[i],
				round,
				pick: i + 1,
				season,
			});
		}

		tids.reverse(); // Snake
	}
};

export default genOrderFantasy;
