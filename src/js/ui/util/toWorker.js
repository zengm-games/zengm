// @flow

import {promiseWorker} from '../util';

const toWorker = (...args) => {
    return promiseWorker.postMessage(args);
};

export default toWorker;
