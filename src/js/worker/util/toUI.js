// @flow

import {promiseWorker} from '../util';

const toUI = (...args) => {
    return promiseWorker.postMessage(args);
};

export default toUI;
