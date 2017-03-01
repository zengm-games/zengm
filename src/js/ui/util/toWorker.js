// @flow

import PromiseWorker from 'promise-worker';

const worker = new Worker('/gen/worker.js');
const promiseWorker = new PromiseWorker(worker);

promiseWorker.postMessage('ping').then(foo => console.log('ui', foo));

const toWorker = (...args) => {
    console.log('toWorker', args)
    return promiseWorker.postMessage(args);
};

export default toWorker;
