// @flow

import { idb } from "../db";

async function updateDashboard(): void | { [key: string]: any } {
    const leagues = await idb.meta.leagues.getAll();

    for (let i = 0; i < leagues.length; i++) {
        if (leagues[i].teamRegion === undefined) {
            leagues[i].teamRegion = "???";
        }
        if (leagues[i].teamName === undefined) {
            leagues[i].teamName = "???";
        }
        delete leagues[i].tid;
    }

    return {
        leagues,
    };
}

export default {
    runBefore: [updateDashboard],
};
