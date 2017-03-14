// @flow

import type {Local} from '../../common/types';

// These variables are transient and will be reset every refresh. See lock.js for more.
const local: Local = {
    autoPlaySeasons: 0,
};

export default local;
