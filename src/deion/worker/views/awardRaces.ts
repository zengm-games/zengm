import { g, overrides } from "../util";
import { UpdateEvents, ViewInput } from "../../common/types";

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
		const awardCandidates = await overrides.core.season.getAwardCandidates!(
			inputs.season,
		);

		return {
			awardCandidates,
			season: inputs.season,
			userTid: g.get("userTid"),
		};
	}
};

export default updateAwardRaces;
