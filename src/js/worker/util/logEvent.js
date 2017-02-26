// @flow

import g from '../../globals';
import createLogger from '../../common/createLogger';
import type {LogEventSaveOptions, LogEventShowOptions} from '../../util/types';

const saveEvent = (event: LogEventSaveOptions) => {
    if (g.cache) {
        g.cache.add('events', Object.assign({}, event, {season: g.season}));
    }
};

const showEvent = (options: LogEventShowOptions) => {
    console.log('worker showEvent', options);
};

const logEvent = createLogger(saveEvent, showEvent);

export default logEvent;
