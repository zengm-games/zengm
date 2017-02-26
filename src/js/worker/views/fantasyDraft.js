// @flow

import g from '../../globals';

async function updateFantasyDraft(): void | {[key: string]: any} {
    return {
        phase: g.phase,
    };
}

export default {
    runBefore: [updateFantasyDraft],
};
