// @flow

import {connectMeta, idb} from './db';
import {changes, checkNaNs, env} from './util';
import * as views from './views';
import type {Env} from '../common/types';

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
