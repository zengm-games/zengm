// @flow

import {promiseWorker} from '../util';

const toUI = (...args: any[]) => {
    return promiseWorker.postMessage(args);
};

export default toUI;
