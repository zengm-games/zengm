// @flow

import { player, team } from "..";
import cancel from "./cancel";
import { idb } from "../../db";
import { g, overrides } from "../../util";

/**
 * Accept the player's offer.
 *
 * If successful, then the team's current roster will be displayed.
 *
 * @memberOf core.contractNegotiation
 * @param {number} pid An integer that must correspond with the player ID of a player in an ongoing negotiation.
 * @return {Promise.<string=>} If an error occurs, resolves to a string error message.
 */
const accept = async (
    pid: number,
    amount: number,
    exp: number,
): Promise<?string> => {
    const negotiation = await idb.cache.negotiations.get(pid);
    if (!negotiation) {
        return `No negotiation with player ${pid} found.`;
    }

    const payroll = await team.getPayroll(g.userTid);

    const birdException = negotiation.resigning && !g.hardCap;

    // If this contract brings team over the salary cap, it's not a minimum contract, and it's not re-signing a current
    // player with the Bird exception, ERROR!
    if (
        !birdException &&
        (payroll + amount - 1 > g.salaryCap && amount - 1 > g.minContract)
    ) {
        return `This contract would put you over the salary cap. You cannot go over the salary cap to sign ${
            g.hardCap ? "players" : "free agents"
        } to contracts higher than the minimum salary.`;
    }

    // This error is for sanity checking in multi team mode. Need to check for existence of negotiation.tid because it
    // wasn't there originally and I didn't write upgrade code. Can safely get rid of it later.
    if (negotiation.tid !== undefined && negotiation.tid !== g.userTid) {
        return `This negotiation was started by the ${
            g.teamRegionsCache[negotiation.tid]
        } ${g.teamNamesCache[negotiation.tid]} but you are the ${
            g.teamRegionsCache[g.userTid]
        } ${
            g.teamNamesCache[g.userTid]
        }. Either switch teams or cancel this negotiation.`;
    }

    const p = await idb.cache.players.get(pid);
    player.sign(
        p,
        g.userTid,
        {
            amount,
            exp,
        },
        g.phase,
    );
    await idb.cache.players.put(p);

    await cancel(pid);

    // If this a depth chart exists, place this player in the depth chart so they are ahead of every player they are
    // better than, without otherwise disturbing the depth chart order
    if (!overrides.core.team.rosterAutoSort) {
        throw new Error("Missing overrides.core.team.rosterAutoSort");
    }
    await overrides.core.team.rosterAutoSort(g.userTid, true);
};

export default accept;
