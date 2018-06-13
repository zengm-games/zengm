// @flow

import { PHASE } from "../../../common";
import { g } from "../../util";

/**
 * Filter untradable players.
 *
 * If a player is not tradable, set untradable flag in the root of the object.
 *
 * @memberOf core.trade
 * @param {Array.<Object>} players Array of player objects or partial player objects
 * @return {Array.<Object>} Processed input
 */
const filterUntradable = (
    players: {
        contract: {
            exp: number,
        },
        gamesUntilTradable: number,
    }[],
): {
    contract: {
        exp: number,
    },
    gamesUntilTradable: number,
    untradable: boolean,
    untradableMsg: string,
}[] => {
    return players.map(p => {
        if (!g.godMode) {
            if (
                p.contract.exp <= g.season &&
                g.phase > PHASE.PLAYOFFS &&
                g.phase < PHASE.FREE_AGENCY
            ) {
                // If the season is over, can't trade players whose contracts are expired
                return Object.assign({}, p, {
                    untradable: true,
                    untradableMsg: "Cannot trade expired contracts",
                });
            }

            if (p.gamesUntilTradable > 0) {
                // Can't trade players who recently were signed or traded
                return Object.assign({}, p, {
                    untradable: true,
                    untradableMsg: `Cannot trade recently-acquired player for ${
                        p.gamesUntilTradable
                    } more games`,
                });
            }
        }

        return Object.assign({}, p, {
            untradable: false,
            untradableMsg: "",
        });
    });
};

export default filterUntradable;
