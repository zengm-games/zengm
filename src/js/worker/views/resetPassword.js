// @flow

import type { GetOutput } from "../../common/types";

async function updateToken(inputs: GetOutput): void | { [key: string]: any } {
    return {
        token: inputs.token,
    };
}

export default {
    runBefore: [updateToken],
};
