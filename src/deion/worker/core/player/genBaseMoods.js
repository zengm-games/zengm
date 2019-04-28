// @flow

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
const genBaseMoods = async (reSigning?: boolean = false): Promise<number[]> => {
    const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
        "teamSeasonsBySeasonTid",
        [[g.season], [g.season, "Z"]],
    );

    return teamSeasons.map(ts => player.genBaseMood(ts, reSigning));
};

export default genBaseMoods;
