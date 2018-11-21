// @flow

import { league } from "..";
import { idb } from "../../../../deion/worker/db";
import { g, helpers, toUI } from "../../../../deion/worker/util";
import { defaultGameAttributes } from "../../util";

/**
 * Load game attributes from the database and update the global variable g.
 *
 * @return {Promise}
 */
const loadGameAttributes = async () => {
    const gameAttributes = await idb.cache.gameAttributes.getAll();

    for (let i = 0; i < gameAttributes.length; i++) {
        g[gameAttributes[i].key] = gameAttributes[i].value;
    }

    // Shouldn't be necessary, but some upgrades fail http://www.reddit.com/r/BasketballGM/comments/2zwg24/cant_see_any_rosters_on_any_teams_in_any_of_my/cpn0j6w
    if (g.userTids === undefined) {
        g.userTids = [g.userTid];
    }

    // Set defaults to avoid IndexedDB upgrade
    for (const key of helpers.keys(defaultGameAttributes)) {
        if (g[key] === undefined) {
            if (
                key === "numGamesPlayoffSeries" &&
                g.hasOwnProperty("numPlayoffRounds")
            ) {
                // If numPlayoffRounds was set back before numGamesPlayoffSeries existed, use that
                await league.setGameAttributes({
                    numGamesPlayoffSeries: league.getValidNumGamesPlayoffSeries(
                        defaultGameAttributes.numGamesPlayoffSeries,
                        g.numPlayoffRounds,
                        g.numTeams,
                    ),
                });
                delete g.numPlayoffRounds;
            } else {
                g[key] = defaultGameAttributes[key];
            }
        }
    }

    await toUI(["setGameAttributes", g]);
};

export default loadGameAttributes;
