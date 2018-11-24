// @flow

import backboard from "backboard";
import { PLAYER } from "../../../common";
import value from "../player/value";
import { idb } from "../../db";

// For debugging changes in the player value formula
const valueDiff = async () => {
    // All non-retired players
    const players = await idb.league.players
        .index("tid")
        .getAll(backboard.lowerBound(PLAYER.FREE_AGENT));

    for (const p of players) {
        console.log(p.value, value(p));
    }
};

export default valueDiff;
