import { idb } from "../db";
import { g } from "../util";

const updateTeamSelect = async () => {
	let teams = await idb.getCopies.teamsPlus({
		attrs: ["tid", "region", "name"],
		seasonAttrs: ["winp"],
		season: g.get("season"),
	});

	// Remove user's team (no re-hiring immediately after firing)
	teams.splice(g.get("userTid"), 1); // If not in god mode, user must have been fired

	if (!g.get("godMode")) {
		// Order by worst record
		teams.sort((a, b) => a.seasonAttrs.winp - b.seasonAttrs.winp); // Only get option of 5 worst

		teams = teams.slice(0, 5);
	}

	return {
		gameOver: g.get("gameOver"),
		godMode: g.get("godMode"),
		phase: g.get("phase"),
		teams,
	};
};

export default updateTeamSelect;
