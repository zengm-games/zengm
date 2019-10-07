// @flow

import { g } from "../util";

async function updateSocialMedia(): void | { [key: string]: any } {
    return {
        teamName: g.teamNamesCache[g.userTid],
    };
}

export default {
    runBefore: [updateSocialMedia],
};
