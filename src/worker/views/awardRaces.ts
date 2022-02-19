import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { season } from "../core";
import { idb } from "../db";
import addFirstNameShort from "../util/addFirstNameShort";

const updateAwardRaces = async (
	inputs: ViewInput<"awardRaces">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(inputs.season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		inputs.season !== state.season
	) {
		const awardCandidates = (
			await season.getAwardCandidates(inputs.season)
		).map(row => ({
			...row,
			players: addFirstNameShort(row.players),
		}));

		const teams = await idb.getCopies.teamsPlus(
			{
				attrs: ["tid"],
				seasonAttrs: ["won", "lost", "tied", "otl"],
				season: inputs.season,
			},
			"noCopyCache",
		);

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
