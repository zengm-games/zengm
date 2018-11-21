// @flow

import { g } from "../../../deion/worker/util";

async function updateFantasyDraft(): void | { [key: string]: any } {
    return {
        phase: g.phase,
    };
}

export default {
    runBefore: [updateFantasyDraft],
};
