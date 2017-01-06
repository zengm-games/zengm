// @flow

import g from '../globals';
import bbgmViewReact from '../util/bbgmViewReact';
import Dashboard from './views/Dashboard';

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

    // http/https crap
    let otherUrl;
    if (window.location.protocol === "http:") {
        if (leagues.length === 0 && window.location.hostname.includes('basketball-gm.com')) {
            window.location.replace(`https://${window.location.hostname}/`);
        }
        otherUrl = `https://${window.location.hostname}/`;
    } else {
        otherUrl = null;
    }

    return {
        leagues,
        otherUrl,
    };
}

export default bbgmViewReact.init({
    id: "dashboard",
    inLeague: false,
    runBefore: [updateDashboard],
    Component: Dashboard,
});
