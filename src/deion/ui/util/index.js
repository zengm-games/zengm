// @flow

import PromiseWorker from "promise-worker-bi";

const workerPath =
    process.env.NODE_ENV === "production"
        ? `/gen/worker-${window.bbgmVersion}.js`
        : "/gen/worker.js";
const worker = window.useSharedWorker
    ? new SharedWorker(workerPath)
    : new Worker(workerPath);

export const promiseWorker = new PromiseWorker(worker);
promiseWorker.registerError(e => {
    if (window.bugsnagClient) {
        window.bugsnagClient.notify(e);
    }
    console.error("Error from worker:");
    console.error(e);
});

export { default as ads } from "./ads";
export { default as compareVersions } from "./compareVersions";
export { default as confirm } from "./confirm";
export { default as downloadFile } from "./downloadFile";
export { default as emitter } from "./emitter";
export { default as genStaticPage } from "./genStaticPage";
export { default as getCols } from "../../common/getCols"; // To save renaming all imports everywhere
export { default as getScript } from "./getScript";
export { default as helpers } from "./helpers";
export { default as initView } from "./initView";
export { default as local } from "./local";
export { default as leagueNotFoundMessage } from "./leagueNotFoundMessage";
export { default as logEvent } from "./logEvent";
export { default as menuItems } from "./menuItems";
export { default as notify } from "./notify";
export { default as overrides } from "./overrides";
export { default as prefixStatOpp } from "./prefixStatOpp";
export { default as realtimeUpdate } from "./realtimeUpdate";
export { default as routes } from "./routes";
export { default as setTitle } from "./setTitle";
export { default as subscribeLocal } from "./subscribeLocal";
export { default as takeScreenshot } from "./takeScreenshot";
export { default as toWorker } from "./toWorker";
