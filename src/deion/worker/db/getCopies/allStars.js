// @flow

import { idb } from "..";
import { mergeByPk } from "./helpers";

const getCopies = async ({ season }: { season?: number } = {}): Promise<
    Object[],
> => {
    if (season !== undefined) {
        const awards = mergeByPk(
            await idb.league.allStars.getAll(season),
            (await idb.cache.allStars.getAll()).filter(row => {
                return row.season === season;
            }),
            idb.cache.storeInfos.allStars.pk,
        );
        return awards;
    }

    return mergeByPk(
        await idb.league.allStars.getAll(),
        await idb.cache.allStars.getAll(),
        idb.cache.storeInfos.allStars.pk,
    );
};

export default getCopies;
