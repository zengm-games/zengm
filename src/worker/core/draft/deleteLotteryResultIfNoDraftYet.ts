import { PHASE } from "../../../common/constants.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";

// Call this when changing anything that can invalidate the current draftLotteryResult during the draft lottery phase, such as adding/removing/enabling/disabling teams or changing draft type.
const deleteLotteryResultIfNoDraftYet = async () => {
	if (g.get("phase") === PHASE.DRAFT_LOTTERY) {
		const draftLotteryResult = await idb.getCopy.draftLotteryResults(
			{
				season: g.get("season"),
			},
			"noCopyCache",
		);

		if (draftLotteryResult) {
			await idb.cache.draftLotteryResults.delete(draftLotteryResult.season);
		}
	}
};

export default deleteLotteryResultIfNoDraftYet;
