// @flow

import {emitter, realtimeUpdate} from '../ui/util';
import {showEvent} from '../ui/util/logEvent';
import type {LogEventShowOptions, UpdateEvents} from '../common/types';

const emit = (name: string, content: any) => {
    emitter.emit(name, content);
};

function realtimeUpdate2(updateEvents: UpdateEvents = [], url?: string, cb?: Function, raw?: Object = {}) {
    realtimeUpdate(updateEvents, url, cb, raw);
}

const showEvent2 = (options: LogEventShowOptions) => {
    showEvent(options);
};

export {
    emit,
    realtimeUpdate2 as realtimeUpdate,
    showEvent2 as showEvent,
};
