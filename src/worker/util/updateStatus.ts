import { PHASE } from "../../common";
import { idb } from "../db";
import g from "./g";
import local from "./local";
import toUI from "./toUI";
import type { Conditions } from "../../common/types";

/*Save status to database and push to client.

If no status is given, set a default status based on game state.

Pass conditions only if you want to force update a single tab (like beforeView).

Args:
    status: A string containing the current status message to be pushed to
        the client.
*/
const updateStatus = async (statusText?: string, conditions?: Conditions) => {
	if (statusText === undefined) {
		// This should only be triggered on loading a league from DB for now, but eventually this could actually
		// populate statusText in most situations (just call with no argument).
		let defaultStatusText = "Idle";

		if (g.get("gameOver")) {
			const t = await idb.cache.teams.get(g.get("userTid"));
			if (t && t.disabled) {
				defaultStatusText = "Your team folded!";
			} else {
				defaultStatusText = "You're fired!";
			}
		} else if (g.get("phase") === PHASE.FREE_AGENCY) {
			defaultStatusText = `${g.get("daysLeft")} days left`;
		} else if (g.get("phase") === PHASE.DRAFT) {
			const drafted = await idb.cache.players.indexGetAll("playersByTid", [
				0,
				Infinity,
			]);

			if (drafted.some(p => p.draft.year === g.get("season"))) {
				defaultStatusText = "Draft in progress...";
			}
		}

		local.statusText = defaultStatusText;
		toUI("updateLocal", [
			{
				statusText: defaultStatusText,
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
