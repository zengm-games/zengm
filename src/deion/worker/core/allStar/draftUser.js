// @flow

import { idb } from "../../db";
import { g } from "../../util";

const draftUser = async (pid: number) => {
    const allStars = await idb.cache.allStars.get(g.season);

    console.log("draftUser", pid);
};

export default draftUser;
