// @flow

import {createLogger, g} from '../../common';
import {idb} from '../db';
import type {LogEventSaveOptions} from '../../common/types';

const saveEvent = (event: LogEventSaveOptions) => {
    if (idb.cache) {
        idb.cache.add('events', Object.assign({}, event, {season: g.season}));
    }
};

const logEvent = createLogger(saveEvent, () => { console.log('Somehow connect to api.showEvent from worker/util/logEvent'); });

export default logEvent;
