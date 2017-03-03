// @flow

import {promiseWorker} from '../util';

const toWorker = (...args) => {
console.log('toWorker', args);
    return promiseWorker.postMessage(args);
};

export default toWorker;
