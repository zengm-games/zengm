// @flow

import type {LogEventSaveOptions, LogEventShowOptions, LogEventType} from '../common/types';

// Really, pids, tids, and type should not be optional if saveToDb is true
type LogEventOptions = {
    extraClass?: string,
    persistent?: boolean,
    pids?: number[],
    saveToDb?: boolean,
    showNotification?: boolean,
    text: string,
    tids?: number[],
    type: LogEventType,
};

function createLogger(
    saveEvent: (LogEventSaveOptions) => void,
    showEvent: (LogEventShowOptions) => void,
): (LogEventOptions) => void {
    const logEvent = ({
        extraClass,
        persistent = false,
        pids,
        saveToDb = true,
        showNotification = true,
        text,
        tids,
        type,
    }: LogEventOptions) => {
        if (saveToDb) {
            if (pids === undefined || tids === undefined || type === undefined) {
                throw new Error('Saved event must include pids, tids, and type');
            }
            saveEvent({
                type,
                text,
                pids,
                tids,
            });
        }

        if (showNotification) {
            showEvent({
                extraClass,
                persistent,
                text,
                type,
            });
        }
    };

    return logEvent;
}

export default createLogger;
