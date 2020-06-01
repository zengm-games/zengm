import { PHASE } from "../../../common";
import { idb } from "../../db";
import { g } from "../../util";

// Call this when adding/removing/enabling/disabling teams. Because if that happens during the draft lottery phase, it's possible the stored draftLotteryResult will be based on the incorrect set of teams, and it needs to be deleted so it can re-run.
const deleteLotteryResultIfNoDraftYet = async () => {
	if (g.get("phase") === PHASE.DRAFT_LOTTERY) {
		const draftLotteryResult = await idb.getCopy.draftLotteryResults({
			season: g.get("season"),
		});

		if (draftLotteryResult) {
			await idb.cache.draftLotteryResults.delete(draftLotteryResult.season);
		}
	}
};

export default deleteLotteryResultIfNoDraftYet;
