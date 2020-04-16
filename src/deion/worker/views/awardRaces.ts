import { PHASE, PLAYER } from "../../common";
import { idb } from "../db";
import { defaultGameAttributes, g, overrides } from "../util";
import { UpdateEvents, ViewInput } from "../../common/types";

const updateAwardRaces = async (
	inputs: ViewInput<"leaders">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	console.log("updateAwardRaces");
	if (
		(inputs.season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		inputs.season !== state.season
	) {
		const awardCandidates = await overrides.core.season.getAwardCandidates!();
		console.log(awardCandidates);

		return {
			awardCandidates,
			season: inputs.season,
			userTid: g.get("userTid"),
		};
	}
};

export default updateAwardRaces;
