// @flow

import { finances } from "..";
import { g, helpers, random } from "../../util";
import type { TeamSeason } from "../../../common/types";

const genBaseMood = (teamSeason: TeamSeason, reSigning: boolean): number => {
    // Special case for winning a title - basically never refuse to re-sign unless a miracle occurs
    if (
        teamSeason.playoffRoundsWon === g.numGamesPlayoffSeries.length &&
        Math.random() < 0.99
    ) {
        return -0.25; // Should guarantee no refusing to re-sign
    }

    let baseMood = 0;

    // Hype
    baseMood += 0.5 * (1 - teamSeason.hype);

    // Facilities - fuck it, just use most recent rank
    baseMood +=
        (0.1 *
            (finances.getRankLastThree([teamSeason], "expenses", "facilities") -
                1)) /
        (g.numTeams - 1);

    // Population
    baseMood += 0.2 * (1 - teamSeason.pop / 10);

    // Randomness
    baseMood += random.uniform(-0.2, 0.4);

    baseMood = helpers.bound(baseMood, 0, 1.2);

    // Difficulty
    if (g.userTids.includes(teamSeason.tid)) {
        baseMood += g.difficulty;
    }

    // Don't let difficulty have too crazy of an impact, for re-signing at least
    if (reSigning) {
        baseMood = helpers.bound(baseMood, 0, 1.5);
    } else if (g.difficulty > 0) {
        baseMood = helpers.bound(baseMood, 0, 1.5 + g.difficulty);
    }

    return baseMood;
};

export default genBaseMood;
