const g = require('../globals');
const bbgmViewReact = require('../util/bbgmViewReact');
const NewLeague = require('./views/NewLeague');

async function updateNewLeague() {
    let newLid = null;

    // Find most recent league and add one to the LID
    await g.dbm.leagues.iterate("prev", (l, shortCircuit) => {
        newLid = l.lid + 1;
        shortCircuit();
    });

    if (newLid === null) {
        newLid = 1;
    }

    return {
        name: `League ${newLid}`,
        lastSelectedTid: parseInt(localStorage.lastSelectedTid, 10),
    };
}

module.exports = bbgmViewReact.init({
    id: "newLeague",
    inLeague: false,
    runBefore: [updateNewLeague],
    Component: NewLeague,
});
