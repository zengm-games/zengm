// @flow

import { promiseWorker } from ".";

const toWorker = (...args: any[]) => {
    return promiseWorker.postMessage(args);
};

export default toWorker;
