import { PHASE } from "../../common/index.ts";
import { idb } from "../db/index.ts";
import { g, local } from "../util/index.ts";

const updateDangerZone = async () => {
	let canRegenerateSchedule = g.get("phase") === PHASE.REGULAR_SEASON;
	if (canRegenerateSchedule) {
		const teams = await idb.getCopies.teamsPlus(
			{
				attrs: ["tid"],
				stats: ["gp"],
				season: g.get("season"),
			},
			"noCopyCache",
		);

		for (const t of teams) {
			if (t.stats.gp !== 0) {
				canRegenerateSchedule = false;
				break;
			}
		}
	}

	return {
		autoSave: local.autoSave,
		canRegenerateSchedule,
		godMode: g.get("godMode"),
		phase: g.get("phase"),
	};
};

export default updateDangerZone;
