// @flow

import { idb } from "../../db";
import { mergeByPk } from "./helpers";
import type { PlayerFeat } from "../../../common/types";

const getCopies = async (): Promise<PlayerFeat[]> => {
    return mergeByPk(
        await idb.league.playerFeats.getAll(),
        await idb.cache.playerFeats.getAll(),
        idb.cache.storeInfos.playerFeats.pk,
    );
};

export default getCopies;
