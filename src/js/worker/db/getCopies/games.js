// @flow

import { idb } from "../../db";
import { mergeByPk } from "./helpers";
import type { Game } from "../../../common/types";

const getCopies = async (
    {
        season,
    }: {
        season?: number,
    } = {},
): Promise<Game[]> => {
    if (season !== undefined) {
        return mergeByPk(
            await idb.league.games.index("season").getAll(season),
            (await idb.cache.games.getAll()).filter(gm => {
                return gm.season === season;
            }),
            idb.cache.storeInfos.games.pk,
        );
    }

    return mergeByPk(
        await idb.league.games.getAll(),
        await idb.cache.games.getAll(),
        idb.cache.storeInfos.games.pk,
    );
};

export default getCopies;
