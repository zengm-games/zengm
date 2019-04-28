// @flow

import fuzzRating from "./fuzzRating";
import { g } from "../../util";
import type {
    MinimalPlayerRatings,
    Player,
    PlayerWithoutPid,
} from "../../../common/types";

/**
 * Returns a numeric value for a given player, representing is general worth to a typical team
 * (i.e. ignoring how well he fits in with his teammates and the team's strategy/finances). It
 * is similar in scale to the overall and potential ratings of players (0-100), but it is based
 * on stats in addition to ratings. The main components are:
 *
 * 1. Recent stats: Avg of last 2 seasons' PER if min > 2000. Otherwise, scale by min / 2000 and
 *     use ratings to estimate the rest.
 * 2. Potential for improvement (or risk for decline): Based on age and potential rating.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @param {Object=} options Object containing several optional options:
 *     noPot: When true, don't include potential in the value calcuation (useful for roster
 *         ordering and game simulation). Default false.
 *     fuzz: When true, used fuzzed ratings (useful for roster ordering, draft prospect
 *         ordering). Default false.
 * @return {number} Value of the player, usually between 50 and 100 like overall and potential
 *     ratings.
 */
const value = (
    p: Player<MinimalPlayerRatings> | PlayerWithoutPid<MinimalPlayerRatings>,
    options: {
        fuzz?: boolean,
        noPot?: boolean,
        withContract?: boolean,
    } = {},
): number => {
    options.noPot = !!options.noPot;
    options.fuzz = !!options.fuzz;
    options.withContract = !!options.withContract;

    // Current ratings
    const pr = {}; // Start blank, add what we need (efficiency, wow!)
    const s = p.ratings.length - 1; // Latest season

    // Fuzz?
    pr.pos = p.ratings[s].pos;
    if (options.fuzz) {
        pr.ovr = fuzzRating(p.ratings[s].ovr, p.ratings[s].fuzz);
        pr.pot = fuzzRating(p.ratings[s].pot, p.ratings[s].fuzz);
    } else {
        pr.ovr = p.ratings[s].ovr;
        pr.pot = p.ratings[s].pot;
    }

    // From linear regression OVR ~ PER
    const slope = 1.531;
    const intercept = 31.693;

    // 1. Account for stats (and current ratings if not enough stats)
    const ps = p.stats.filter(playerStats => !playerStats.playoffs);
    let current = pr.ovr; // No stats at all? Just look at ratings more, then.
    if (process.env.SPORT === "basketball" && ps.length > 0) {
        const ps1 = ps[ps.length - 1]; // Most recent stats

        if (ps.length === 1 || ps[0].min >= 2000) {
            // Only one year of stats
            current = intercept + slope * ps1.per;
            if (ps1.min < 2000) {
                current =
                    (current * ps1.min) / 2000 + pr.ovr * (1 - ps1.min / 2000);
            }
        } else {
            // Two most recent seasons
            const ps2 = ps[ps.length - 2];
            if (ps1.min + ps2.min > 0) {
                current =
                    intercept +
                    (slope * (ps1.per * ps1.min + ps2.per * ps2.min)) /
                        (ps1.min + ps2.min);

                if (ps1.min + ps2.min < 2000) {
                    current =
                        (current * (ps1.min + ps2.min)) / 2000 +
                        pr.ovr * (1 - (ps1.min + ps2.min) / 2000);
                }
            }
        }
        current = 0.1 * pr.ovr + 0.9 * current; // Include some part of the ratings
    }

    // 2. Potential
    let potential = pr.pot;

    if (process.env.SPORT === "football") {
        if (pr.pos === "QB") {
            current *= 1.25;
            potential *= 1.25;
        } else if (pr.pos === "K" || pr.pos === "P") {
            current *= 0.25;
            potential *= 0.25;
        }
    }

    // Short circuit if we don't care about potential
    if (options.noPot) {
        return current;
    }

    // If performance is already exceeding predicted potential, just use that
    if (current >= potential) {
        potential = current;
    }

    let age;
    if (p.draft.year > g.season) {
        // Draft prospect
        age = p.draft.year - p.born.year;
    } else {
        age = g.season - p.born.year;
    }

    // Otherwise, combine based on age
    if (age <= 19) {
        return 0.8 * potential + 0.2 * current;
    }
    if (age === 20) {
        return 0.7 * potential + 0.3 * current;
    }
    if (age === 21) {
        return 0.6 * potential + 0.4 * current;
    }
    if (age === 22) {
        return 0.5 * potential + 0.5 * current;
    }
    if (age === 23) {
        return 0.4 * potential + 0.6 * current;
    }
    if (age === 24) {
        return 0.3 * potential + 0.7 * current;
    }
    if (age === 25) {
        return 0.2 * potential + 0.8 * current;
    }
    if (age === 26) {
        return 0.1 * potential + 0.9 * current;
    }
    if (age === 27) {
        return current;
    }
    if (age === 28) {
        return current;
    }
    if (age === 29) {
        return current;
    }
    if (age === 30) {
        return 0.975 * current;
    }
    if (age === 31) {
        return 0.95 * current;
    }
    if (age === 32) {
        return 0.9 * current;
    }
    if (age === 33) {
        return 0.85 * current;
    }
    return 0.8 * current;
};

export default value;
