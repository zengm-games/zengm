// @flow

import orderBy from "lodash/orderBy";
import { idb } from "..";
import { mergeByPk } from "./helpers";
import type { DraftPick } from "../../../common/types";

const getCopies = async ({ tid }: { tid?: number } = {}): Promise<
    DraftPick[],
> => {
    let draftPicks;
    if (tid !== undefined) {
        draftPicks = mergeByPk(
            [], // All picks always in cache
            await idb.cache.draftPicks.indexGetAll("draftPicksByTid", tid),
            idb.cache.storeInfos.draftPicks.pk,
        );
    } else {
        draftPicks = mergeByPk(
            [], // All picks always in cache
            await idb.cache.draftPicks.getAll(),
            idb.cache.storeInfos.draftPicks.pk,
        );
    }

    return orderBy(draftPicks, ["season", "round", "pick", "originalTid"]);
};

export default getCopies;
