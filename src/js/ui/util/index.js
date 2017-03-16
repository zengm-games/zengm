// @flow

import PromiseWorker from '../../../../../promise-worker-bi';
console.log('window.useSharedWorker', window.useSharedWorker);
const worker = window.useSharedWorker ? new SharedWorker('/gen/worker.js') : new Worker('/gen/worker.js');
export const promiseWorker = new PromiseWorker(worker);

export {default as ads} from './ads';
export {default as emitter} from './emitter';
export {default as genStaticPage} from './genStaticPage';
export {default as getCols} from './getCols';
export {default as initView} from './initView';
export {default as logEvent} from './logEvent';
export {default as notify} from './notify';
export {default as realtimeUpdate} from './realtimeUpdate';
export {default as setTitle} from './setTitle';
export {default as toWorker} from './toWorker';
