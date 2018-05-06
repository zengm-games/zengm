// @flow

import orderBy from "lodash/orderBy";
import { g } from "../../../common";
import { idb } from "../../db";

/**
 * Retrieve the current remaining draft order.
 *
 * @memberOf core.draft
 * @return {Promise} Resolves to an ordered array of pick objects.
 */
const getOrder = async () => {
    const draftPicks = await idb.cache.draftPicks.indexGetAll(
        "draftPicksBySeason",
        g.season,
    );

    return orderBy(draftPicks, ["round", "pick"]);
};

export default getOrder;
