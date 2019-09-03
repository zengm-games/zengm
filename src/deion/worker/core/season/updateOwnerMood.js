// @flow

import { idb } from "../../db";
import { g } from "../../util";
import type { OwnerMood } from "../../../common/types";

/**
 * Update teamSeason.ownerMood based on performance this season, only for user's team.
 *
 * This is based on three factors: regular season performance, playoff performance, and finances. Designed to be called after the playoffs end.
 *
 * @memberOf core.season
 * @return {Promise.Object} Resolves to an object containing the changes in teamSeason.ownerMood this season.
 */
const updateOwnerMood = async (): Promise<OwnerMood> => {
    const t = await idb.getCopy.teamsPlus({
        seasonAttrs: ["won", "playoffRoundsWon", "profit"],
        season: g.season,
        tid: g.userTid,
    });
    if (!t) {
        throw new Error("Team not found");
    }

    const teamSeason = await idb.cache.teamSeasons.indexGet(
        "teamSeasonsByTidSeason",
        [g.userTid, g.season],
    );
    if (!teamSeason) {
        throw new Error("Team season not found");
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

    if (!teamSeason.ownerMood) {
        teamSeason.ownerMood = g.ownerMood
            ? g.ownerMood
            : {
                  money: 0,
                  playoffs: 0,
                  wins: 0,
              };
    }

    // Bound only the top - can't win the game by doing only one thing, but you can lose it by neglecting one thing
    if (teamSeason.ownerMood.wins + deltas.wins > 1) {
        deltas.wins = 1 - teamSeason.ownerMood.wins;
    }
    if (teamSeason.ownerMood.playoffs + deltas.playoffs > 1) {
        deltas.playoffs = 1 - teamSeason.ownerMood.playoffs;
    }
    if (teamSeason.ownerMood.money + deltas.money > 1) {
        deltas.money = 1 - teamSeason.ownerMood.money;
    }

    // Only update owner mood if grace period is over
    if (g.season >= g.gracePeriodEnd && !g.godMode) {
        teamSeason.ownerMood.money += deltas.money;
        teamSeason.ownerMood.playoffs += deltas.playoffs;
        teamSeason.ownerMood.wins += deltas.wins;

        await idb.cache.teamSeasons.put(teamSeason);
    }

    return deltas;
};

export default updateOwnerMood;
