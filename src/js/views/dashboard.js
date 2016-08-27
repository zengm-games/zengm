const g = require('../globals');
const bbgmViewReact = require('../util/bbgmViewReact');
const Dashboard = require('./views/Dashboard');

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
        if (leagues.length === 0 && window.location.hostname.indexOf("basketball-gm.com") >= 0) {
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

module.exports = bbgmViewReact.init({
    id: "dashboard",
    inLeague: false,
    runBefore: [updateDashboard],
    Component: Dashboard,
});
