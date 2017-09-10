// @flow

import PromiseWorker from "promise-worker-bi";
const worker = window.useSharedWorker
    ? new SharedWorker("/gen/worker.js")
    : new Worker("/gen/worker.js");
export const promiseWorker = new PromiseWorker(worker);
promiseWorker.registerError(e => {
    if (window.Bugsnag) {
        window.Bugsnag.notifyException(new Error(e.message), "ErrorInWorker", {
            colno: e.colno,
            lineno: e.lineno,
            groupingHash: JSON.stringify([e.message, e.colno, e.lineno]),
        });
    }
    console.error("Error from worker:");
    console.error(e);
});

export { default as ads } from "./ads";
export { default as emitter } from "./emitter";
export { default as genStaticPage } from "./genStaticPage";
export { default as getCols } from "./getCols";
export { default as getScript } from "./getScript";
export { default as initView } from "./initView";
export { default as logEvent } from "./logEvent";
export { default as notify } from "./notify";
export { default as realtimeUpdate } from "./realtimeUpdate";
export { default as setTitle } from "./setTitle";
export { default as toWorker } from "./toWorker";
