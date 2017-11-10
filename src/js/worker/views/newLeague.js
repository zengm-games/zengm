// @flow

import { idb } from "../db";

async function updateNewLeague(): void | { [key: string]: any } {
    let newLid = null;

    // Find most recent league and add one to the LID
    await idb.meta.leagues.iterate("prev", (l, shortCircuit) => {
        newLid = l.lid + 1;
        shortCircuit();
    });

    if (newLid === null) {
        newLid = 1;
    }

    let lastSelectedTid = await idb.meta.attributes.get("lastSelectedTid");
    if (typeof lastSelectedTid !== "number" || Number.isNaN(lastSelectedTid)) {
        lastSelectedTid = -1;
    }

    return {
        name: `League ${newLid}`,
        lastSelectedTid,
    };
}

export default {
    runBefore: [updateNewLeague],
};
