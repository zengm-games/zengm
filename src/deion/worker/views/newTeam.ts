import { idb } from "../db";
import { g, helpers } from "../util";
import { PHASE } from "../../common";
import orderBy from "lodash/orderBy";

const updateTeamSelect = async () => {
	const rawTeams = await idb.getCopies.teamsPlus({
		attrs: ["tid", "region", "name", "pop"],
		seasonAttrs: ["winp"],
		season: g.get("season"),
		active: true,
		addDummySeason: true,
	});

	let teams = helpers.addPopRank(rawTeams);

	const numActiveTeams = teams.length;

	const expansionDraft = g.get("expansionDraft");
	const expansion =
		g.get("phase") === PHASE.EXPANSION_DRAFT &&
		expansionDraft.phase === "protection" &&
		expansionDraft.allowSwitchTeam;
	const expansionTids =
		expansionDraft.phase === "protection" ? expansionDraft.expansionTids : []; // TypeScript bullshit

	const t = await idb.cache.teams.get(g.get("userTid"));
	const disabled = t ? t.disabled : false;

	if (!expansion) {
		// Remove user's team (no re-hiring immediately after firing)
		teams = teams.filter(t => t.tid !== g.get("userTid"));
	}

	if (expansion) {
		// User team will always be first, cause expansion teams are at the end of the teams list
		teams = teams.filter(
			t => t.tid === g.get("userTid") || expansionTids.includes(t.tid),
		);
	} else if (!g.get("godMode")) {
		// If not in god mode, user must have been fired or team folded

		// Order by worst record
		teams.sort((a, b) => a.seasonAttrs.winp - b.seasonAttrs.winp);

		// Only get option of 5 worst
		teams = teams.slice(0, 5);
	}

	let orderedTeams = orderBy(teams, ["region", "name", "tid"]);
	if (expansion) {
		// User team first!
		const userTeam = teams.find(t => t.tid === g.get("userTid"));
		if (userTeam) {
			orderedTeams = [userTeam, ...orderedTeams.filter(t => t !== userTeam)];
		}
	}

	return {
		disabled,
		expansion,
		gameOver: g.get("gameOver"),
		godMode: g.get("godMode"),
		numActiveTeams,
		phase: g.get("phase"),
		teams: orderedTeams,
		userTid: g.get("userTid"),
	};
};

export default updateTeamSelect;
