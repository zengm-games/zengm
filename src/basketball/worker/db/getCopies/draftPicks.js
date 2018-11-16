// @flow

import { idb } from "..";
import { mergeByPk } from "./helpers";
import type { DraftPick } from "../../../../deion/common/types";

const getCopies = async ({ tid }: { tid?: number } = {}): Promise<
    DraftPick[],
> => {
    if (tid !== undefined) {
        const draftPicks = mergeByPk(
            [], // All picks always in cache
            await idb.cache.draftPicks.indexGetAll("draftPicksByTid", tid),
            idb.cache.storeInfos.draftPicks.pk,
        );
        return draftPicks;
    }

    return mergeByPk(
        [], // All picks always in cache
        await idb.cache.draftPicks.getAll(),
        idb.cache.storeInfos.draftPicks.pk,
    );
};

export default getCopies;
