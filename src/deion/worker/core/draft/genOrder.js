// @flow

import genOrderNBA from "./genOrderNBA";
import genOrderNone from "./genOrderNone";
import { g } from "../../util";
import type { Conditions } from "../../../common/types";

/**
 * Sets draft order and save it to the draftPicks object store.
 *
 * If mock is true, then nothing is actually saved to the database and no notifications are sent
 *
 * @memberOf core.draft
 * @return {Promise}
 */
const genOrder = async (
    mock?: boolean = false,
    conditions?: Conditions,
): Promise<void> => {
    if (g.draftType === "noLottery") {
        await genOrderNone(mock);
    } else {
        await genOrderNBA(mock, conditions);
    }
};

export default genOrder;
