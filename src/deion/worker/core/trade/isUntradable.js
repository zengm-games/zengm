// @flow

import { PHASE } from "../../../common";
import { g } from "../../util";
import type { Player, PlayerWithoutPid } from "../../../common/types";

const isUntradable = (
    p: Player<> | PlayerWithoutPid<>,
): {
    untradable: boolean,
    untradableMsg: string,
} => {
    if (!g.godMode) {
        if (
            p.contract.exp <= g.season &&
            g.phase > PHASE.PLAYOFFS &&
            g.phase < PHASE.FREE_AGENCY
        ) {
            // If the season is over, can't trade players whose contracts are expired
            return {
                untradable: true,
                untradableMsg: "Cannot trade expired contracts",
            };
        }

        if (p.gamesUntilTradable > 0) {
            // Can't trade players who recently were signed or traded
            return {
                untradable: true,
                untradableMsg: `Cannot trade recently-acquired player for ${
                    p.gamesUntilTradable
                } more games`,
            };
        }
    }

    return {
        untradable: false,
        untradableMsg: "",
    };
};

export default isUntradable;
