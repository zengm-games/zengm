// @flow

import { createLogger, g } from "../../common";
import { idb } from "../db";
import { toUI } from "../util";
import type {
    Conditions,
    LogEventSaveOptions,
    LogEventShowOptions,
} from "../../common/types";

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
