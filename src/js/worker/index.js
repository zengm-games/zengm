// @flow

import {connectMeta} from './db';
import * as views from './views';
import * as helpers from '../util/helpers';

const init = async () => {
    // NaN detection
    helpers.checkNaNs();

    await connectMeta();
};

export {
    init,
    views,
};
