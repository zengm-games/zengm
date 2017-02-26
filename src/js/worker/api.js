// @flow

import {realtimeUpdate} from '../ui/util';
import {showEvent} from '../ui/util/logEvent';
import type {LogEventShowOptions, UpdateEvents} from '../common/types';

function realtimeUpdate2(updateEvents: UpdateEvents = [], url?: string, cb?: Function, raw?: Object = {}) {
    realtimeUpdate(updateEvents, url, cb, raw);
}

const showEvent2 = (options: LogEventShowOptions) => {
    showEvent(options);
};

export {
    realtimeUpdate2 as realtimeUpdate,
    showEvent2 as showEvent,
};
