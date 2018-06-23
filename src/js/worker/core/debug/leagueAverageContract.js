// @flow

import backboard from "backboard";
import { PLAYER } from "../../../common";
import { player } from "..";
import { idb } from "../../db";

// Returns the average contract for the active players in the league
// Useful to run this while playing with the contract formula in core.player.genContract
const leagueAverageContract = async () => {
    // All non-retired players
    const players = await idb.league.players
        .index("tid")
        .getAll(backboard.lowerBound(PLAYER.FREE_AGENT));

    let total = 0;

    for (let i = 0; i < players.length; i++) {
        const p = players[i];
        const contract = player.genContract(p);
        total += contract.amount;
    }

    console.log(total / players.length);
};

export default leagueAverageContract;
