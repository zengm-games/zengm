import genOrderNBA from "./genOrderNBA";
import genOrderNone from "./genOrderNone";
import { g } from "../../util";
import type { Conditions } from "../../../common/types";

/**
 * Sets draft order and save it to the draftPicks object store.
 *
 * If mock is true, then nothing is actually saved to the database and no notifications are sent
 *
 * @memberOf core.draft
 * @return {Promise}
 */
const genOrder = async (
	mock: boolean = false,
	conditions?: Conditions,
): Promise<void> => {
	if (g.get("draftType") === "freeAgents") {
		throw new Error(
			"genOrder should not be called for draftType of freeAgents",
		);
	} else if (
		g.get("draftType") === "noLottery" ||
		g.get("draftType") === "noLotteryReverse" ||
		g.get("draftType") === "random"
	) {
		await genOrderNone(mock);
	} else {
		try {
			await genOrderNBA(mock, conditions);
		} catch (error) {
			if (!(error as any).notEnoughTeams) {
				throw error;
			}

			await genOrderNone(mock);
		}
	}
};

export default genOrder;
