// @flow

import backboard from "backboard";
import close from "./close";
import { idb } from "../../db";
import { g } from "../../util";

/**
 * Delete an existing league.
 *
 * @memberOf core.league
 * @param {number} lid League ID.
 * @param {function()=} cb Optional callback.
 */
const remove = async (lid: number) => {
    if (g.lid === lid) {
        close(true);
    }
    idb.meta.leagues.delete(lid);
    await backboard.delete(`league${lid}`);
};

export default remove;
