// @flow

import orderBy from "lodash/orderBy";
import range from "lodash/range";
import { PLAYER } from "../../../common";
import skills from "./skills";
import { helpers, overrides } from "../../util";
import type { MinimalPlayerRatings } from "../../../common/types";

// Repeatedly simulate aging up to 29, and pick the 75th percentile max
const NUM_SIMULATIONS = 20; // Higher is more accurate, but slower. Low accuracy is fine, though!
export const bootstrapPot = (
    ratings: MinimalPlayerRatings,
    age: number,
    pos?: string,
): number => {
    if (age >= 29) {
        return pos ? ratings.ovrs[pos] : ratings.ovr;
    }

    const maxOvrs = range(NUM_SIMULATIONS).map(() => {
        const copiedRatings = helpers.deepCopy(ratings);

        let maxOvr = pos ? ratings.ovrs[pos] : ratings.ovr;
        for (let ageTemp = age + 1; ageTemp < 30; ageTemp++) {
            if (!overrides.core.player.developSeason) {
                throw new Error("Missing overrides.core.player.developSeason");
            }
            overrides.core.player.developSeason(
                copiedRatings,
                ageTemp,
                undefined,
                pos,
            ); // Purposely no coachingRank
            if (!overrides.core.player.ovr) {
                throw new Error("Missing overrides.core.player.ovr");
            }
            const currentOvr = overrides.core.player.ovr(copiedRatings, pos);
            if (currentOvr > maxOvr) {
                maxOvr = currentOvr;
            }
        }

        return maxOvr;
    });

    return orderBy(maxOvrs)[Math.floor(0.75 * NUM_SIMULATIONS)];
};

/**
 * Develop (increase/decrease) player's ratings. This operates on whatever the last row of p.ratings is.
 *
 * Make sure to call updateValues after this! Otherwise, player values will be out of sync.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @param {number=} years Number of years to develop (default 1).
 * @param {boolean=} newPlayer Generating a new player? (default false). If true, then the player's age is also updated based on years.
 * @param {number=} coachingRank From 1 to g.numTeams (default 30), where 1 is best coaching staff and g.numTeams is worst. Default is 15.5
 * @return {Object} Updated player object.
 */
const develop = (
    p: {
        born: { loc: string, year: number },
        draft: { ovr: number, pot: number, skills: string[] },
        pos?: string,
        ratings: MinimalPlayerRatings[],
        tid: number,
    },
    years?: number = 1,
    newPlayer?: boolean = false,
    coachingRank?: number = 15.5,
    skipPot?: boolean = false, // Only for making testing or core/debug faster
) => {
    const ratings = p.ratings[p.ratings.length - 1];

    let age = ratings.season - p.born.year;

    for (let i = 0; i < years; i++) {
        // (CONFUSING!) Don't increment age for existing players developing one season (i.e. newPhasePreseason) because the season is already incremented before this function is called. But in other scenarios (new league and draft picks), the season is not changing, so age should be incremented every iteration of this loop.
        if (newPlayer || years > 1) {
            age += 1;
        }

        if (!overrides.core.player.developSeason) {
            throw new Error("Missing overrides.core.player.developSeason");
        }
        overrides.core.player.developSeason(
            ratings,
            age,
            coachingRank,
            ratings.pos,
        );
    }

    // Run these even for players developing 0 seasons
    if (process.env.SPORT === "basketball") {
        if (!overrides.core.player.ovr) {
            throw new Error("Missing overrides.core.player.ovr");
        }
        ratings.ovr = overrides.core.player.ovr(ratings);
        if (!skipPot) {
            ratings.pot = bootstrapPot(ratings, age);
        }

        if (p.hasOwnProperty("pos") && typeof p.pos === "string") {
            // Must be a custom league player, let's not rock the boat
            ratings.pos = p.pos;
        } else {
            if (!overrides.core.player.pos) {
                throw new Error("Missing overrides.core.player.pos");
            }
            ratings.pos = overrides.core.player.pos(ratings);
        }
    } else {
        let pos;
        let maxOvr = 0;

        // A player can never have KR or PR as his main position
        const bannedPositions = ["KR", "PR"];

        ratings.ovrs = overrides.constants.POSITIONS.reduce((ovrs, pos2) => {
            if (!overrides.core.player.ovr) {
                throw new Error("Missing overrides.core.player.ovr");
            }
            ovrs[pos2] = overrides.core.player.ovr(ratings, pos2);

            if (!bannedPositions.includes(pos2) && ovrs[pos2] > maxOvr) {
                pos = pos2;
                maxOvr = ovrs[pos2];
            }

            return ovrs;
        }, {});
        if (!skipPot) {
            ratings.pots = overrides.constants.POSITIONS.reduce(
                (pots, pos2) => {
                    pots[pos2] = bootstrapPot(ratings, age, pos2);

                    return pots;
                },
                {},
            );
        }

        if (pos === undefined) {
            throw new Error("Should never happen");
        }

        ratings.ovr = ratings.ovrs[pos];
        ratings.pot = ratings.pots[pos];

        if (p.hasOwnProperty("pos") && typeof p.pos === "string") {
            // Must be a manually specified position
            ratings.pos = p.pos;
        } else {
            ratings.pos = pos;
        }
    }
    ratings.skills = skills(ratings);

    if (
        p.tid === PLAYER.UNDRAFTED ||
        p.tid === PLAYER.UNDRAFTED_2 ||
        p.tid === PLAYER.UNDRAFTED_3
    ) {
        p.draft.ovr = ratings.ovr;
        if (!skipPot) {
            p.draft.pot = ratings.pot;
        }
        p.draft.skills = ratings.skills;
    }

    if (newPlayer) {
        p.born.year -= years;
    }
};

export default develop;
