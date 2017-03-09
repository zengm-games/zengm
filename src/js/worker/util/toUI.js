// @flow

import {promiseWorker} from '../util';

const toUI = (...args: any[]) => {
    // $FlowFixMe
    if (typeof it === 'function') { return; }
    return promiseWorker.postMessage(args);
};

export default toUI;
