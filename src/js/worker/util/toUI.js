// @flow

import { promiseWorker } from ".";
import type { Conditions } from "../../common/types";

const toUI = (args: any[], conditions?: Conditions = {}): Promise<any> => {
    // $FlowFixMe
    if (typeof it === "function") {
        return Promise.resolve();
    }
    return promiseWorker.postMessage(args, conditions.hostID);
};

export default toUI;
