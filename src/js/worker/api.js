// @flow

import {emitter, realtimeUpdate} from '../ui/util';
import {showEvent} from '../ui/util/logEvent';
import type {GameAttributes, LogEventShowOptions, UpdateEvents} from '../common/types';

const emit = (name: string, content: any) => {
    emitter.emit(name, content);
};

async function realtimeUpdate2(updateEvents: UpdateEvents = [], url?: string, raw?: Object = {}) {
    await realtimeUpdate(updateEvents, url, raw);
}

const setGameAttributes = (gameAttributes: GameAttributes) => {
    console.log('Should populate g in ui', gameAttributes);
};

const showEvent2 = (options: LogEventShowOptions) => {
    showEvent(options);
};

export {
    emit,
    realtimeUpdate2 as realtimeUpdate,
    setGameAttributes,
    showEvent2 as showEvent,
};
