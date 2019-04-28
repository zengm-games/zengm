// @flow

import { g } from "../../util";
import type { TeamSeason } from "../../../common/types";

/**
 * Gets the rank of some financial thing over the past 3 seasons, if available.
 *
 * If only 1 or 2 seasons are available, assume 15.5 (average) for the other seasons
 *
 * @memberOf core.finances
 * @param {Object} t Team object
 * @param {string} category Currently either "expenses" or "revenues", but could be extended to allow "budget" if needed.
 * @param {string} item Item inside the category
 * @return {number} Rank, from 1 to g.numTeams (default 30)
 */
const getRankLastThree = (
    teamSeasons: TeamSeason[],
    category: "expenses" | "revenues",
    item: string,
): number => {
    const defaultRank = (g.numTeams + 1) / 2;

    const s = teamSeasons.length - 1; // Most recent season index
    if (s > 1) {
        // Use three seasons if possible
        return (
            (teamSeasons[s][category][item].rank +
                teamSeasons[s - 1][category][item].rank +
                teamSeasons[s - 2][category][item].rank) /
            3
        );
    }
    if (s > 0) {
        // Use two seasons if possible
        return (
            (teamSeasons[s][category][item].rank +
                teamSeasons[s - 1][category][item].rank +
                defaultRank) /
            3
        );
    }
    if (s === 0) {
        return (teamSeasons[s][category][item].rank + 2 * defaultRank) / 3;
    }

    return defaultRank;
};

export default getRankLastThree;
