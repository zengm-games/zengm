// @flow

import { promiseWorker } from "../util";
import type { Conditions } from "../../common/types";

const toUI = (args: any[], conditions?: Conditions = {}) => {
    // $FlowFixMe
    if (typeof it === "function") {
        return;
    }
    return promiseWorker.postMessage(args, conditions.hostID);
};

export default toUI;
