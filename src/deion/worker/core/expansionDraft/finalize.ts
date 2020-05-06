import { league } from "..";
import { PHASE } from "../../../common";
import { g } from "../../util";
import { idb } from "../../db";

const finalize = async () => {
	await league.setGameAttributes({
		expansionDraft: {
			phase: "setup",
		},
	});

	// If draft lottery already happened, get rid of it so we can do it again with the new teams
	if (g.get("phase") === PHASE.DRAFT_LOTTERY) {
		const draftLotteryResult = await idb.getCopy.draftLotteryResults({
			season: g.get("season"),
		});

		if (draftLotteryResult) {
			await idb.cache.draftLotteryResults.delete(draftLotteryResult.season);
			await idb.cache.flush(); // Since draftLotteryResult might be in IndexedDB
		}
	}
};

export default finalize;
