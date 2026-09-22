import { PHASE } from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import g from "./g.ts";
import local from "./local.ts";
import toUI from "./toUI.ts";
import { helpers } from "./index.ts";

const updateStatusIfNew = (statusText: string) => {
	if (statusText !== local.statusText) {
		local.statusText = statusText;
		toUI("updateLocal", [
			{
				statusText,
			},
		]);
	}
};

const updateStatus = async (statusText?: string) => {
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

		updateStatusIfNew(computedStatusText);
	} else {
		updateStatusIfNew(statusText);
	}
};

export default updateStatus;
