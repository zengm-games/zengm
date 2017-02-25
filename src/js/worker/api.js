// @flow

import {realtimeUpdate} from '../ui/util';
import type {UpdateEvents} from '../util/types';

function realtimeUpdate2(updateEvents: UpdateEvents = [], url?: string, cb?: Function, raw?: Object = {}) {
    realtimeUpdate(updateEvents, url, cb, raw);
}

export {
    // eslint-disable-next-line import/prefer-default-export
    realtimeUpdate2 as realtimeUpdate,
};
