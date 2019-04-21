// @flow

import { league } from "..";
import { idb } from "../../db";
import { g } from "../../util";
import type { OwnerMoodDeltas } from "../../../common/types";

/**
 * Update g.ownerMood based on performance this season.
 *
 * This is based on three factors: regular season performance, playoff performance, and finances. Designed to be called after the playoffs end.
 *
 * @memberOf core.season
 * @return {Promise.Object} Resolves to an object containing the changes in g.ownerMood this season.
 */
const updateOwnerMood = async (): Promise<OwnerMoodDeltas> => {
    const t = await idb.getCopy.teamsPlus({
        seasonAttrs: ["won", "playoffRoundsWon", "profit"],
        season: g.season,
        tid: g.userTid,
    });
    if (!t) {
        throw new Error("Invalid g.userTid");
    }

    const numPlayoffRounds = g.numGamesPlayoffSeries.length;

    const deltas = {
        wins: (0.25 * (t.seasonAttrs.won - g.numGames / 2)) / (g.numGames / 2),
        playoffs: 0,
        money: (t.seasonAttrs.profit - 15) / 100,
    };
    if (t.seasonAttrs.playoffRoundsWon < 0) {
        deltas.playoffs = -0.2;
    } else if (t.seasonAttrs.playoffRoundsWon < numPlayoffRounds) {
        deltas.playoffs =
            (0.16 / numPlayoffRounds) * t.seasonAttrs.playoffRoundsWon;
    } else {
        deltas.playoffs = 0.2;
    }

    // Only update owner mood if grace period is over
    if (g.season >= g.gracePeriodEnd) {
        const ownerMood = {
            wins: g.ownerMood.wins + deltas.wins,
            playoffs: g.ownerMood.playoffs + deltas.playoffs,
            money: g.ownerMood.money + deltas.money,
        };

        // Bound only the top - can't win the game by doing only one thing, but you can lose it by neglecting one thing
        if (ownerMood.wins > 1) {
            ownerMood.wins = 1;
        }
        if (ownerMood.playoffs > 1) {
            ownerMood.playoffs = 1;
        }
        if (ownerMood.money > 1) {
            ownerMood.money = 1;
        }

        await league.setGameAttributes({ ownerMood });
    }

    return deltas;
};

export default updateOwnerMood;
