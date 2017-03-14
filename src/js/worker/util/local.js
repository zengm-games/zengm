// @flow

import type {Local} from '../../common/types';

// These variables are transient and will be reset every refresh. See lock.js for more.

const defaultLocal: Local = {
    autoPlaySeasons: 0,
    phaseText: '',
};

const local: Local & {reset: () => void} = {
    autoPlaySeasons: 0,
    phaseText: '',
    reset: () => {
        for (const key of Object.keys(defaultLocal)) {
            local[key] = defaultLocal[key];
        }
    },
};

export default local;
