// @flow

import { promiseWorker } from "../util";

const toWorker = (...args: any[]) => {
    return promiseWorker.postMessage(args);
};

export default toWorker;
