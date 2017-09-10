// @flow

import { changes } from "../util";

async function updateChanges(): void | { [key: string]: any } {
    return {
        changes: changes.all.slice(0).reverse(),
    };
}

export default {
    runBefore: [updateChanges],
};
