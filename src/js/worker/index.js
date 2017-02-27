// @flow

import {connectMeta} from './db';
import {changes, checkNaNs} from './util';
import * as views from './views';

const init = async () => {
    // NaN detection
    checkNaNs();

    // Any news?
    changes.check();

    await connectMeta();
};

export {
    init,
    views,
};
