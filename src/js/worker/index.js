// @flow

/* eslint-disable import/first */
import '../vendor/babel-external-helpers';
import Promise from 'bluebird';
import * as api from './api';
import {promiseWorker} from './util';

// Overwrite Promise object globally so Babel uses it when transpiling async/await (not totally sure if necessary)
self.Promise = Promise;
self.Promise.config({warnings: false});

promiseWorker.register(([name, ...params]) => {
    if (name.indexOf('actions.') === 0) {
        const subname = name.replace('actions.');
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
