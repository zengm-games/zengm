// @flow

/* eslint-disable import/first */
import "../../deion/common/polyfills";
import api from "../../deion/worker/api";
import * as common from "../common";
import * as core from "../../deion/worker/core";
import * as db from "../../deion/worker/db";
import * as util from "../../deion/worker/util";

// source-map-support doesn't seem to do anything here. Source maps work great in Chrome with native promises, and
// shitty in Firefox with polyfill. Either way, sourceMapSupport doesn't change anything.

// eslint-disable-next-line no-restricted-globals
self.bbgm = Object.assign({}, common, core, db, util);

// God damn this function is ugly, clean up! Can probably share with ui.
util.promiseWorker.register(([name, ...params], hostID) => {
    const conditions = {
        hostID,
    };

    if (name.indexOf("actions.") === 0) {
        let subname = name.replace("actions.", "");

        if (subname.indexOf("playMenu.") === 0) {
            subname = subname.replace("playMenu.", "");

            if (!api.actions.playMenu.hasOwnProperty(subname)) {
                throw new Error(
                    `API call to nonexistant worker function "${name}" with params ${JSON.stringify(
                        params,
                    )}`,
                );
            }

            return api.actions.playMenu[subname](...params, conditions);
        }
        if (subname.indexOf("toolsMenu.") === 0) {
            subname = subname.replace("toolsMenu.", "");

            if (!api.actions.toolsMenu.hasOwnProperty(subname)) {
                throw new Error(
                    `API call to nonexistant worker function "${name}" with params ${JSON.stringify(
                        params,
                    )}`,
                );
            }

            return api.actions.toolsMenu[subname](...params, conditions);
        }

        if (!api.actions.hasOwnProperty(subname)) {
            throw new Error(
                `API call to nonexistant worker function "${name}" with params ${JSON.stringify(
                    params,
                )}`,
            );
        }

        return api.actions[subname](...params, conditions);
    }

    if (name.indexOf("processInputs.") === 0) {
        const subname = name.replace("processInputs.", "");

        if (!api.processInputs.hasOwnProperty(subname)) {
            // processInputs is not needed for every page
            return {};
        }

        const obj = api.processInputs[subname](...params, conditions);

        // Return empty object rather than undefined
        return obj === undefined ? {} : obj;
    }

    if (!api.hasOwnProperty(name)) {
        throw new Error(
            `API call to nonexistant worker function "${name}" with params ${JSON.stringify(
                params,
            )}`,
        );
    }

    return api[name](...params, conditions);
});
