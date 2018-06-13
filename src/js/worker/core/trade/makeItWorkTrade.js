// @flow

import { idb } from "../../db";
import { g, helpers } from "../../util";
import getPickValues from "./getPickValues";
import makeItWork from "./makeItWork";
import summary from "./summary";

/**
 * Make a trade work
 *
 * This should be called for a trade negotiation, as it will update the trade objectStore.
 *
 * @memberOf core.trade
 * @return {Promise.string} Resolves to a string containing a message to be dispalyed to the user, as if it came from the AI GM.
 */
const makeItWorkTrade = async () => {
    const [estValues, tr] = await Promise.all([
        getPickValues(),
        idb.cache.trade.get(0),
    ]);
    const teams0 = tr.teams;

    const teams = await makeItWork(helpers.deepCopy(teams0), false, estValues);

    if (teams === undefined) {
        return `${
            g.teamRegionsCache[teams0[1].tid]
        } GM: "I can't afford to give up so much."`;
    }

    const s = await summary(teams);

    // Store AI's proposed trade in database, if it's different
    let updated = false;

    for (let i = 0; i < 2; i++) {
        if (teams[i].tid !== teams0[i].tid) {
            updated = true;
            break;
        }
        if (teams[i].pids.toString() !== teams0[i].pids.toString()) {
            updated = true;
            break;
        }
        if (teams[i].dpids.toString() !== teams0[i].dpids.toString()) {
            updated = true;
            break;
        }
    }

    if (updated) {
        const tr2 = await idb.cache.trade.get(0);
        tr2.teams = teams;
        await idb.cache.trade.put(tr2);
    }

    if (s.warning) {
        return `${
            g.teamRegionsCache[teams[1].tid]
        } GM: "Something like this would work if you can figure out how to get it done without breaking the salary cap rules."`;
    }

    return `${g.teamRegionsCache[teams[1].tid]} GM: "How does this sound?"`;
};

export default makeItWorkTrade;
