// @flow

import {connectMeta} from './db';
import {changes} from './util';
import * as views from './views';
import * as helpers from '../util/helpers';

const init = async () => {
    // NaN detection
    helpers.checkNaNs();

    // Any news?
    changes.check();

    await connectMeta();
};

export {
    init,
    views,
};
