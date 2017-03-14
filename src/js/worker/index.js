// @flow

/* eslint-disable import/first */
import '../vendor/babel-external-helpers';
import 'indexeddb-getall-shim';
import api from './api';
import * as common from '../common';
import * as core from './core';
import * as db from './db';
import * as util from './util';

// source-map-support doesn't seem to do anything here. Source maps work great in Chrome with native promises, and
// shitty in Firefox with polyfill. Either way, sourceMapSupport doesn't change anything.

self.bbgm = Object.assign({}, common, core, db, util);

// God damn this function is ugly, clean up! Can probably share with ui.
util.promiseWorker.register(([name, ...params]) => {
    if (name.indexOf('actions.') === 0) {
        let subname = name.replace('actions.', '');

        if (subname.indexOf('playMenu.') === 0) {
            subname = subname.replace('playMenu.', '');

            if (!api.actions.playMenu.hasOwnProperty(subname)) {
                throw new Error(`API call to nonexistant worker function "${name}" with params ${JSON.stringify(params)}`);
            }

            return api.actions.playMenu[subname](...params);
        } else if (subname.indexOf('toolsMenu.') === 0) {
            subname = subname.replace('toolsMenu.', '');

            if (!api.actions.toolsMenu.hasOwnProperty(subname)) {
                throw new Error(`API call to nonexistant worker function "${name}" with params ${JSON.stringify(params)}`);
            }

            return api.actions.toolsMenu[subname](...params);
        }

        if (!api.actions.hasOwnProperty(subname)) {
            throw new Error(`API call to nonexistant worker function "${name}" with params ${JSON.stringify(params)}`);
        }

        return api.actions[subname](...params);
    }

    if (!api.hasOwnProperty(name)) {
        throw new Error(`API call to nonexistant worker function "${name}" with params ${JSON.stringify(params)}`);
    }

    return api[name](...params);
});
