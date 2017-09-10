// @flow

import { idb } from "../../db";
import { mergeByPk } from "./helpers";
import type { Awards } from "../../../common/types";

const getCopies = async (
    { season }: { season?: number } = {},
): Promise<Awards[]> => {
    if (season !== undefined) {
        const awards = mergeByPk(
            await idb.league.awards.getAll(season),
            (await idb.cache.awards.getAll()).filter(event => {
                return event.season === season;
            }),
            idb.cache.storeInfos.awards.pk,
        );
        return awards;
    }

    return mergeByPk(
        await idb.league.awards.getAll(),
        await idb.cache.awards.getAll(),
        idb.cache.storeInfos.awards.pk,
    );
};

export default getCopies;
