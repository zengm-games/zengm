// @flow

import {connectMeta} from './db';
import * as views from './views';
import * as helpers from '../util/helpers';

(async () => {
    // NaN detection
    helpers.checkNaNs();

    await connectMeta();
})();

export {
    // eslint-disable-next-line import/prefer-default-export
    views,
};
