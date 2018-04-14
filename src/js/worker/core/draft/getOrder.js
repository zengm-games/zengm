// @flow

import { idb } from "../../db";

/**
 * Retrieve the current remaining draft order.
 *
 * @memberOf core.draft
 * @return {Promise} Resolves to an ordered array of pick objects.
 */
const getOrder = async () => {
    const row = await idb.cache.draftOrder.get(0);
    return row.draftOrder;
};

export default getOrder;
