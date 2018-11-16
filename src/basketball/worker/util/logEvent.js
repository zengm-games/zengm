// @flow

import { createLogger } from "../../../deion/common";
import { idb } from "../db";
import { g, toUI } from ".";
import type {
    Conditions,
    LogEventSaveOptions,
    LogEventShowOptions,
} from "../../../deion/common/types";

const saveEvent = (event: LogEventSaveOptions) => {
    if (idb.cache) {
        idb.cache.events.add(Object.assign({}, event, { season: g.season }));
    }
};

// conditions only needed when showNotification is true, otherwise this is never called
const logEvent = createLogger(
    saveEvent,
    (options: LogEventShowOptions, conditions?: Conditions) => {
        toUI(["showEvent", options], conditions);
    },
);

export default logEvent;
