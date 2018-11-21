// @flow

import { idb } from "../../../../deion/worker/db";
import { g } from "../../../../deion/worker/util";

const updateMetaNameRegion = async (name: string, region: string) => {
    const l = await idb.meta.leagues.get(g.lid);
    l.teamName = name;
    l.teamRegion = region;
    await idb.meta.leagues.put(l);
};

export default updateMetaNameRegion;
