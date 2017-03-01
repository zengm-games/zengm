// @flow

/* eslint-disable import/first */
import '../vendor/babel-external-helpers';
import registerPromiseWorker from 'promise-worker/register';
import * as api from './api';
import {connectMeta, idb} from './db';
import {changes, checkNaNs, env} from './util';
import * as views from './views';
import type {Env} from '../common/types';

registerPromiseWorker(([name, params]) => {
    if (!api.hasOwnProperty(name)) {
        throw new Error(`API call to nonexistant worker function "${name}"`);
    }

    return api[name](...params);
});

const init = async (inputEnv: Env) => {
    env.enableLogging = inputEnv.enableLogging;
    env.inCordova = inputEnv.inCordova;
    env.tld = inputEnv.tld;

    // NaN detection
    checkNaNs();

    // Any news?
    changes.check();

    idb.meta = await connectMeta();
};

export {
    init,
    views,
};
