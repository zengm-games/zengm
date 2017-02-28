// @flow

import {g} from '../../common';

async function updateFantasyDraft(): void | {[key: string]: any} {
    return {
        phase: g.phase,
    };
}

export default {
    runBefore: [updateFantasyDraft],
};
