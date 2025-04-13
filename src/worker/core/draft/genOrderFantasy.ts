import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import league from "../league/index.ts";

const genOrderFantasy = async (
	tids: number[],
	season: "fantasy" | "expansion" = "fantasy",
) => {
	const numRounds = g.get("minRosterSize");

	// Set total draft order, snaking picks each round
	for (let round = 1; round <= numRounds; round++) {
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

	await league.setGameAttributes({
		numDraftPicksCurrent: numRounds * tids.length,
	});
};

export default genOrderFantasy;
