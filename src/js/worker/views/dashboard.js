// @flow

import g from '../../globals';

async function updateDashboard() {
    const leagues = await g.dbm.leagues.getAll();

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
