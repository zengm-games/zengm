import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { season } from "../core";
import { idb } from "../db";

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
		const awardCandidates = await season.getAwardCandidates(inputs.season);

		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid"],
			seasonAttrs: ["won", "lost", "tied", "otl"],
			season: inputs.season,
		});

		return {
			awardCandidates,
			challengeNoRatings: g.get("challengeNoRatings"),
			season: inputs.season,
			userTid: g.get("userTid"),
			teams,
		};
	}
};

export default updateAwardRaces;
