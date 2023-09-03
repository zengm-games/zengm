import { g, helpers } from "../util";
import getTeamInfos from "../../common/getTeamInfos";
import type { UpdateEvents } from "../../common/types";

const updateExpand = async (inputs: void, updateEvents: UpdateEvents) => {
	// Ignore team updateEvent from relocateVote, and newPhase from starting the expansion draft
	if (!updateEvents.includes("team") && !updateEvents.includes("newPhase")) {
		const autoExpand = g.get("autoExpand");
		if (!autoExpand) {
			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				redirectUrl: helpers.leagueUrl([]),
			};
			return returnValue;
		}

		const newTeams =
			autoExpand.phase === "vote"
				? getTeamInfos(
						autoExpand.abbrevs.map((abbrev, i) => {
							return {
								tid: g.get("numTeams") + 1 + i,
								cid: -1,
								did: -1,
								abbrev,
							};
						}),
				  )
				: [];

		return {
			godMode: g.get("godMode"),
			newTeams,
		};
	}
};

export default updateExpand;
