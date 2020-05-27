import { g } from "../util";
import type { UpdateEvents } from "../../common/types";
import { idb } from "../db";

const updateMultiTeamMode = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("g.userTids") ||
		updateEvents.includes("newPhase")
	) {
		const teamsAll = await idb.cache.teams.getAll();

		const teams = teamsAll
			.filter(t => !t.disabled)
			.map(t => ({
				tid: t.tid,
				region: t.region,
				name: t.name,
			}));

		return {
			phase: g.get("phase"),
			teams,
			userTid: g.get("userTid"),
			userTids: g.get("userTids"),
		};
	}
};

export default updateMultiTeamMode;
