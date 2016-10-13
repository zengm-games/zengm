import g from '../globals';
import bbgmViewReact from '../util/bbgmViewReact';
import NewLeague from './views/NewLeague';

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

    let lastSelectedTid = parseInt(localStorage.lastSelectedTid, 10);
    if (isNaN(lastSelectedTid)) {
        lastSelectedTid = -1;
    }

    return {
        name: `League ${newLid}`,
        lastSelectedTid,
    };
}

export default bbgmViewReact.init({
    id: "newLeague",
    inLeague: false,
    runBefore: [updateNewLeague],
    Component: NewLeague,
});
