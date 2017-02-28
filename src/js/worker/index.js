// @flow

import {connectMeta, idb} from './db';
import {changes, checkNaNs} from './util';
import * as views from './views';

const init = async () => {
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
