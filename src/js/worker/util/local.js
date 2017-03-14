// @flow

import type {Local} from '../../common/types';

// These variables are transient and will be reset every refresh. See lock.js for more.

const defaultLocal: Local = {
    autoPlaySeasons: 0,
};

const local: Local & {reset: () => void} = {
    autoPlaySeasons: 0,
    reset: () => {
        for (const key of Object.keys(defaultLocal)) {
            local[key] = defaultLocal[key];
        }
    },
};

export default local;
