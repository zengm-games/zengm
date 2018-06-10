// @flow

import { idb } from "../../db";
import { g } from "../../../common";
import { helpers, toUI } from "../../util";
import type { GameAttributes } from "../../../common/types";

/**
 * Set values in the gameAttributes objectStore and update the global variable g.
 *
 * Items stored in gameAttributes are globally available through the global variable g. If a value is a constant across all leagues/games/whatever, it should just be set in globals.js instead.
 *
 * @param {Object} gameAttributes Each property in the object will be inserted/updated in the database with the key of the object representing the key in the database.
 * @returns {Promise} Promise for when it finishes.
 */
const setGameAttributes = async (gameAttributes: GameAttributes) => {
    const toUpdate = [];
    for (const key of helpers.keys(gameAttributes)) {
        if (g[key] !== gameAttributes[key]) {
            toUpdate.push(key);
        }
    }

    for (const key of toUpdate) {
        await idb.cache.gameAttributes.put({
            key,
            value: gameAttributes[key],
        });

        g[key] = gameAttributes[key];
    }

    await toUI(["setGameAttributes", gameAttributes]);
    if (toUpdate.includes("userTid") || toUpdate.includes("userTids")) {
        await toUI(["emit", "updateMultiTeam"]);
    }
};

export default setGameAttributes;
