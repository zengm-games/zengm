// @flow

import g from '../../globals';

async function updateFantasyDraft() {
    return {
        phase: g.phase,
    };
}

export default {
    runBefore: [updateFantasyDraft],
};
