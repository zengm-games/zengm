// @flow

import g from '../../globals';
import {createLogger} from '../../common';
import type {LogEventSaveOptions} from '../../util/types';
import * as api from '../api';

const saveEvent = (event: LogEventSaveOptions) => {
    if (g.cache) {
        g.cache.add('events', Object.assign({}, event, {season: g.season}));
    }
};

const logEvent = createLogger(saveEvent, api.showEvent);

export default logEvent;
