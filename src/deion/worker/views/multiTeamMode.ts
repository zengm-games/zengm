import { g } from "../util";
import type { UpdateEvents } from "../../common/types";

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

		for (let i = 0; i < g.get("numTeams"); i++) {
			teams.push({
				tid: i,
				name: `${g.get("teamRegionsCache")[i]} ${g.get("teamNamesCache")[i]}`,
			});
		}

		return {
			phase: g.get("phase"),
			teams,
			userTid: g.get("userTid"),
			userTids: g.get("userTids"),
		};
	}
};

export default updateMultiTeamMode;
