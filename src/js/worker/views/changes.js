// @flow

import * as changes from '../../data/changes';

async function updateChanges() {
    return {
        changes: changes.all.slice(0).reverse(),
    };
}

export default {
    runBefore: [updateChanges],
};
