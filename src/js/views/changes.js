// @flow

import * as changes from '../data/changes';
import bbgmViewReact from '../util/bbgmViewReact';
import Changes from './views/Changes';

async function updateChanges() {
    return {
        changes: changes.all.slice(0).reverse(),
    };
}

export default bbgmViewReact.init({
    id: "changes",
    inLeague: false,
    runBefore: [updateChanges],
    Component: Changes,
});
