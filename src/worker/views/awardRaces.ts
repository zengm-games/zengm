import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { season } from "../core";

const updateAwardRaces = async (
	inputs: ViewInput<"leaders">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(inputs.season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		inputs.season !== state.season
	) {
		const awardCandidates = await season.getAwardCandidates!(inputs.season);

		return {
			awardCandidates,
			season: inputs.season,
			userTid: g.get("userTid"),
		};
	}
};

export default updateAwardRaces;
