import { player } from "..";
import { idb } from "../../db";
import { g } from "../../util";

/**
 * Calculates the base "mood" factor for any free agent towards a team.
 *
 * This base mood is then modulated for an individual player in addToFreeAgents.
 *
 * @return {Promise} Array of base moods, one for each team.
 */
const genBaseMoods = async (reSigning: boolean = false): Promise<number[]> => {
	const teams = await idb.cache.teams.getAll();
	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsBySeasonTid",
		[[g.get("season")], [g.get("season"), "Z"]],
	);
	return teams.map(t => {
		const ts = teamSeasons.find(ts2 => ts2.tid === t.tid);
		if (ts) {
			return player.genBaseMood(ts, reSigning);
		}

		// Must be an expansion team - not very desirable!
		return 1;
	});
};

export default genBaseMoods;
