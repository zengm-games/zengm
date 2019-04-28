// @flow

import { overrides } from "../util";

async function updateChanges(): void | { [key: string]: any } {
    return {
        changes: overrides.util.changes.slice(0).reverse(),
    };
}

export default {
    runBefore: [updateChanges],
};
