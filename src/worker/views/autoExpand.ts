import { g, helpers } from "../util/index.ts";
import getTeamInfos from "../../common/getTeamInfos.ts";
import { defineView } from "../util/defineView.ts";

export default defineView("autoExpand", ({ updateEvents }) => {
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
			newTeams,
		};
	}
});
