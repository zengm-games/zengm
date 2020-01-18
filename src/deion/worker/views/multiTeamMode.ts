import { g } from "../util";
import { UpdateEvents } from "../../common/types";

const updateMultiTeamMode = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("g.userTids") ||
		updateEvents.includes("newPhase")
	) {
		const teams: {
			tid: number;
			name: string;
		}[] = [];

		for (let i = 0; i < g.numTeams; i++) {
			teams.push({
				tid: i,
				name: `${g.teamRegionsCache[i]} ${g.teamNamesCache[i]}`,
			});
		}

		return {
			phase: g.phase,
			teams,
			userTid: g.userTid,
			userTids: g.userTids,
		};
	}
};

export default updateMultiTeamMode;
