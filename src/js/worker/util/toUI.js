// @flow

import {promiseWorker} from '../util';

const toUI = (...args) => {
console.log('toUI', args);
    return promiseWorker.postMessage(args);
};

export default toUI;
