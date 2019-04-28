// @flow

import { g, injuries, random } from "../../util";
import type { PlayerInjury } from "../../../common/types";

/**
 * Pick injury type and duration.
 *
 * This depends on core.data.injuries, health expenses, and randomness.
 *
 * @param {number} healthRank Between 1 and g.numTeams (default 30), 1 if the player's team has the highest health spending this season and g.numTeams if the player's team has the lowest.
 * @return {Object} Injury object (type and gamesRemaining)
 */
const injury = (healthRank: number): PlayerInjury => {
    const rand = random.uniform(0, 10882);
    const i = injuries.cumSum.findIndex(cs => cs >= rand);

    let gamesRemaining = Math.round(
        ((0.7 * (healthRank - 1)) / (g.numTeams - 1) + 0.65) *
            random.uniform(0.25, 1.75) *
            injuries.gamesRemainings[i],
    );

    // Hack for football
    if (process.env.SPORT === "football") {
        gamesRemaining = Math.ceil(gamesRemaining / 3);
    }

    return {
        type: injuries.types[i],
        gamesRemaining,
    };
};

export default injury;
