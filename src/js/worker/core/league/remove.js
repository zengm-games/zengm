// @flow

import backboard from "backboard";
import { idb } from "../../db";
import { g } from "../../../common";
import close from "./close";

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
