// @flow

import { g } from "../../../../deion/worker/util";
import type { Player, PlayerWithoutPid } from "../../../../deion/common/types";
import type { PlayerRatings } from "../../../common/types";

const madeHof = (
    p: Player<PlayerRatings> | PlayerWithoutPid<PlayerRatings>,
): boolean => {
    const av = p.stats
        .filter(ps => {
            // No playoff stats, because AV is scaled strangely there
            return !ps.playoffs;
        })
        .map(ps => ps.av);

    // Calculate career WS and "dominance factor" DF (top 5 years WS - 35)
    av.sort((a, b) => b - a); // Descending order
    let total = 0;
    let df = -35;
    for (let i = 0; i < av.length; i++) {
        total += av[i];
        if (i < 5) {
            df += av[i];
        }
    }

    // Fudge factor for players generated when the league started
    const fudgeSeasons = g.startingSeason - p.draft.year - 7;
    if (fudgeSeasons > 0) {
        total += av[0] * fudgeSeasons;
    }

    // Final formula
    return total + df > 100;
};

export default madeHof;
