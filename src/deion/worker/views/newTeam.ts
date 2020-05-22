import { idb } from "../db";
import { g, helpers } from "../util";
import { PHASE } from "../../common";

const updateTeamSelect = async () => {
	const rawTeams = await idb.getCopies.teamsPlus({
		attrs: ["tid", "region", "name", "pop"],
		seasonAttrs: ["winp"],
		season: g.get("season"),
		addDummySeason: true,
	});

	let teams = helpers.addPopRank(rawTeams);

	const numTeams = teams.length;

	const expansionDraft = g.get("expansionDraft");
	const expansion =
		g.get("phase") === PHASE.EXPANSION_DRAFT &&
		expansionDraft.phase === "protection" &&
		expansionDraft.allowSwitchTeam;
	const expansionTids =
		expansionDraft.phase === "protection" ? expansionDraft.expansionTids : []; // TypeScript bullshit

	if (!expansion) {
		// Remove user's team (no re-hiring immediately after firing)
		teams.splice(g.get("userTid"), 1);
	}

	if (expansion) {
		// User team will always be first, cause expansion teams are at the end of the teams list
		teams = teams.filter(
			t => t.tid === g.get("userTid") || expansionTids.includes(t.tid),
		);
	} else if (!g.get("godMode")) {
		// If not in god mode, user must have been fired

		// Order by worst record
		teams.sort((a, b) => a.seasonAttrs.winp - b.seasonAttrs.winp); // Only get option of 5 worst

		teams = teams.slice(0, 5);
	}

	return {
		expansion,
		gameOver: g.get("gameOver"),
		godMode: g.get("godMode"),
		numTeams,
		phase: g.get("phase"),
		teams,
		userTid: g.get("userTid"),
	};
};

export default updateTeamSelect;
