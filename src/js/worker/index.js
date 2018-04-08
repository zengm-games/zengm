// @flow

/* eslint-disable import/first */
import "../vendor/babel-external-helpers";
import "../common/polyfills";
import api from "./api";
import * as common from "../common";
import * as core from "./core";
import * as db from "./db";
import * as util from "./util";

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
        } else if (subname.indexOf("toolsMenu.") === 0) {
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

    if (!api.hasOwnProperty(name)) {
        throw new Error(
            `API call to nonexistant worker function "${name}" with params ${JSON.stringify(
                params,
            )}`,
        );
    }

    return api[name](...params, conditions);
});
