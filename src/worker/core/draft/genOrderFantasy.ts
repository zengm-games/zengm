import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import league from "../league/index.ts";

const genOrderFantasy = async (
	tids: number[],
	season: "fantasy" | "expansion" = "fantasy",
) => {
	const numRounds = g.get("minRosterSize");

	// Set total draft order, snaking picks each round
	const draftPicksToSave = [];
	for (let round = 1; round <= numRounds; round++) {
		for (const [i, tid] of tids.entries()) {
			draftPicksToSave.push({
				tid,
				originalTid: tid,
				round,
				pick: i + 1,
				season,
			});
		}

		tids.reverse(); // Snake
	}
	await idb.cache.draftPicks.addAll(draftPicksToSave);

	await league.setGameAttributes({
		numDraftPicksCurrent: numRounds * tids.length,
	});
};

export default genOrderFantasy;
