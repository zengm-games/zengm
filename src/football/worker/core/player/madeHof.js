// @flow

import { g } from "../../../../deion/worker/util";
import type { Player, PlayerWithoutPid } from "../../../../deion/common/types";
import type { PlayerRatings } from "../../../common/types";

const getMostCommonPos = (ratings: PlayerRatings[]) => {
    const counts = new Map<string, number>();

    for (const { pos } of ratings) {
        let count = counts.get(pos) || 0;
        count += 1;
        counts.set(pos, count);
    }

    let maxCount = -Infinity;
    let maxPos;

    for (const [pos, count] of counts.entries()) {
        if (count > maxCount) {
            maxCount = count;
            maxPos = pos;
        }
    }

    return maxPos;
};

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

    const pos = getMostCommonPos(p.ratings);

    /**
     * Goals
     * QB: 100 per 100 yrs
     * RB: 25 per 100 yrs
     * WR: 50 per 100 yrs
     * TE: 25 per 100 yrs
     * OL: 25 per 100 yrs
     * DL: 50 per 100 yrs
     * LB: 50 per 100 yrs
     * S: 25 per 100 yrs
     * CB: 25 per 100 yrs
     */
    let threshold = 100;
    if (pos === "QB") {
        threshold = 160;
    } else if (pos === "RB") {
        threshold = 75;
    } else if (pos === "WR") {
        threshold = 115;
    } else if (pos === "TE") {
        threshold = 115;
    } else if (pos === "OL") {
        threshold = 70;
    } else if (pos === "DL") {
        threshold = 90;
    } else if (pos === "LB") {
        threshold = 65;
    } else if (pos === "S") {
        threshold = 44;
    } else if (pos === "CB") {
        threshold = 40;
    }

    // Final formula
    return total + df > threshold;
};

export default madeHof;
