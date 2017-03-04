// @flow

import {createLogger, g} from '../../common';
import {idb} from '../db';
import {toUI} from '../util';
import type {LogEventSaveOptions, LogEventShowOptions} from '../../common/types';

const saveEvent = (event: LogEventSaveOptions) => {
    if (idb.cache) {
        idb.cache.add('events', Object.assign({}, event, {season: g.season}));
    }
};

const logEvent = createLogger(saveEvent, (options: LogEventShowOptions) => {
    toUI('showEvent', options);
});

export default logEvent;
