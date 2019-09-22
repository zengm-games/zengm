// @flow

import { idb } from "../../db";
import { g } from "../../util";
import draftOne from "./draftOne";

const draftAll = async (): Promise<number[]> => {
    const allStars = await idb.cache.allStars.get(g.season);

    const pids = [];
    while (!allStars.finalized) {
        const pid = await draftOne();
        pids.push(pid);
    }

    return pids;
};

export default draftAll;
