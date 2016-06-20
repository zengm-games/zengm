const g = require('../globals');
const ui = require('../ui');
const bbgmView = require('../util/bbgmView');
const viewHelpers = require('../util/viewHelpers');

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
        if (leagues.length === 0 && window.location.hostname.indexOf("basketball-gm") >= 0) {
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

function uiFirst() {
    ui.title("Dashboard");
}

module.exports = bbgmView.init({
    id: "dashboard",
    beforeReq: viewHelpers.beforeNonLeague,
    runBefore: [updateDashboard],
    uiFirst,
});
