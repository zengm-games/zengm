// @flow

import orderBy from "lodash/orderBy";
import { PHASE } from "../../../common";
import { idb } from "../../db";
import { g } from "../../util";

/**
 * Retrieve the current remaining draft order.
 *
 * @memberOf core.draft
 * @return {Promise} Resolves to an ordered array of pick objects.
 */
const getOrder = async () => {
    const season = g.phase === PHASE.FANTASY_DRAFT ? "fantasy" : g.season;

    const draftPicks = await idb.cache.draftPicks.indexGetAll(
        "draftPicksBySeason",
        season,
    );

    return orderBy(draftPicks, ["round", "pick"]);
};

export default getOrder;
