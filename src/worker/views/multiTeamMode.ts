import type { UpdateEvents } from "../../common/types.ts";
import { idb } from "../db/index.ts";

const updateMultiTeamMode = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes") ||
		updateEvents.includes("newPhase")
	) {
		const teamsAll = await idb.cache.teams.getAll();

		const teams = teamsAll
			.filter((t) => !t.disabled)
			.map((t) => ({
				tid: t.tid,
				region: t.region,
				name: t.name,
			}));

		return {
			teams,
		};
	}
};

export default updateMultiTeamMode;
