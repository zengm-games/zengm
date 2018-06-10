// @flow

import { g } from "../../../common";
import { idb } from "../../db";
import { helpers } from "../../util";
import type { PlayoffSeries } from "../../../common/types";

const getCopy = async ({ season }: { season: number } = {}): Promise<
    PlayoffSeries,
> => {
    if (season === g.season) {
        return helpers.deepCopy(await idb.cache.playoffSeries.get(season));
    }

    return idb.league.playoffSeries.get(season);
};

export default getCopy;
