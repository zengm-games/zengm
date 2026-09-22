import { PHASE } from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import g from "./g.ts";
import local from "./local.ts";
import toUI from "./toUI.ts";
import type { Conditions } from "../../common/types.ts";
import { helpers } from "./index.ts";

/*Save status to database and push to client.

If no status is given, set a default status based on game state.

Pass conditions only if you want to force update a single tab (like beforeView).

Args:
    status: A string containing the current status message to be pushed to
        the client.
*/
const updateStatus = async (statusText?: string, conditions?: Conditions) => {
	if (statusText === undefined) {
		let computedStatusText = "Idle";

		if (g.get("gameOver")) {
			const t = await idb.cache.teams.get(g.get("userTid"));
			if (t && t.disabled) {
				computedStatusText = "Your team folded!";
			} else {
				computedStatusText = "You're fired!";
			}
		} else if (g.get("phase") === PHASE.FREE_AGENCY) {
			computedStatusText = helpers.daysLeft(true);
		} else if (g.get("phase") === PHASE.DRAFT) {
			const drafted = await idb.cache.players.indexGetAll("playersByTid", [
				0,
				Infinity,
			]);

			if (drafted.some((p) => p.draft.year === g.get("season"))) {
				computedStatusText = "Draft in progress...";
			}
		}

		local.statusText = computedStatusText;
		toUI("updateLocal", [
			{
				statusText: computedStatusText,
			},
		]);
	} else if (statusText !== local.statusText) {
		local.statusText = statusText;
		toUI("updateLocal", [
			{
				statusText,
			},
		]);
	} else if (conditions !== undefined) {
		toUI(
			"updateLocal",
			[
				{
					statusText,
				},
			],
			conditions,
		);
	}
};

export default updateStatus;
