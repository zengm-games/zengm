// @flow

import g from '../../globals';
import {createLogger} from '../../common';
import * as api from '../api';
import {idb} from '../db';
import type {LogEventSaveOptions} from '../../common/types';

const saveEvent = (event: LogEventSaveOptions) => {
    if (idb.cache) {
        idb.cache.add('events', Object.assign({}, event, {season: g.season}));
    }
};

const logEvent = createLogger(saveEvent, api.showEvent);

export default logEvent;
