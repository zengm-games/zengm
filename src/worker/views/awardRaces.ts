import { g } from "../util/index.ts";
import type { UpdateEvents, ViewInput } from "../../common/types.ts";
import { season } from "../core/index.ts";
import { idb } from "../db/index.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";

const updateAwardRaces = async (
	inputs: ViewInput<"awardRaces">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		(inputs.season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		inputs.season !== state.season
	) {
		const awardCandidates = (
			await season.getAwardCandidates(inputs.season)
		).map((row) => ({
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
