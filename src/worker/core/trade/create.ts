import { idb } from "../../db";
import type { TradeTeams } from "../../../common/types";
import get from "./get";

/**
 * Start a new trade with a team.
 *
 * @memberOf core.trade
 * @param {Array.<Object>} teams Array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs). If the other team's tid is null, it will automatically be determined from the pids.
 * @return {Promise}
 */
const create = async (teams: TradeTeams) => {
	const tr = await get();

	// If nothing is in this trade, it's just a team switch, so keep the old stuff from the user's team
	if (
		teams[0].pids.length === 0 &&
		teams[1].pids.length === 0 &&
		teams[0].dpids.length === 0 &&
		teams[1].dpids.length === 0
	) {
		teams[0].pids = tr.teams[0].pids;
		teams[0].dpids = tr.teams[0].dpids;
	}

	tr.teams = teams;
	await idb.cache.trade.put(tr);
};

export default create;
