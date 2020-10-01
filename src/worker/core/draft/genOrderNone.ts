import genPicks from "./genPicks";
import lotterySort from "./lotterySort";
import { idb } from "../../db";
import { g, random } from "../../util";
import type { DraftPick } from "../../../common/types";
import genOrderGetPicks from "./genOrderGetPicks";

const genOrderNone = async (mock: boolean = false): Promise<void> => {
	const teams = await idb.getCopies.teamsPlus({
		attrs: ["tid"],
		seasonAttrs: [
			"winp",
			"playoffRoundsWon",
			"won",
			"lost",
			"tied",
			"cid",
			"did",
		],
		season: g.get("season"),
		addDummySeason: true,
		active: true,
	});

	const draftType = g.get("draftType");

	if (draftType !== "random") {
		lotterySort(teams);
		if (draftType === "noLotteryReverse") {
			teams.reverse();
		}
	}

	// Sometimes picks just fail to generate or get lost. For example, if numSeasonsFutureDraftPicks is 0.
	await genPicks();

	const draftPicks = await genOrderGetPicks(mock);

	// Reorganize this to an array indexed on originalTid and round
	const draftPicksIndexed: DraftPick[][] = [];

	for (const dp of draftPicks) {
		const tid = dp.originalTid; // Initialize to an array

		if (draftPicksIndexed[tid] === undefined) {
			draftPicksIndexed[tid] = [];
		}

		draftPicksIndexed[tid][dp.round] = dp;
	}

	for (let round = 1; round <= g.get("numDraftRounds"); round++) {
		if (draftType === "random") {
			random.shuffle(teams);
		}

		let pick = 1;
		for (let i = 0; i < teams.length; i++) {
			const dp = draftPicksIndexed[teams[i].tid]?.[round];

			if (dp !== undefined) {
				dp.pick = pick;
				pick += 1;
			}
		}
	}

	if (!mock) {
		for (const dp of draftPicks) {
			await idb.cache.draftPicks.put(dp);
		}
	}
};

export default genOrderNone;
