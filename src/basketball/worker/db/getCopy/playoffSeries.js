// @flow

import { idb } from "..";
import { g, helpers } from "../../../../deion/worker/util";
import type { PlayoffSeries } from "../../../../deion/common/types";

const getCopy = async ({
    season,
}: { season: number } = {}): Promise<PlayoffSeries> => {
    if (season === g.season) {
        return helpers.deepCopy(await idb.cache.playoffSeries.get(season));
    }

    return idb.league.playoffSeries.get(season);
};

export default getCopy;
