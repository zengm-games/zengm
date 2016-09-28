// @flow

import g from '../globals';
import * as league from '../core/league';
import notify from '../lib/bbgm-notifications';
import type {BackboardTx} from './types';

// Really, pids, tids, and type should not be optional if saveToDb is true
type LogEventOptions = {
    extraClass?: string,
    persistent?: boolean,
    pids?: number[],
    saveToDb?: boolean,
    showNotification?: boolean,
    text: string,
    tids?: number[],
    type: ?('award' | 'changes' | 'draft' | 'error' | 'freeAgent' | 'playoffs' | 'refuseToSign' | 'release' | 'reSigned' | 'trade'),
}

const logEvent = (tx: ?BackboardTx, {
    extraClass,
    persistent = false,
    pids,
    saveToDb = true,
    showNotification = true,
    text,
    tids,
    type,
}: LogEventOptions) => {
    if (saveToDb && g.lid) { // Only save to league event log if within a league
        const dbOrTx = tx !== undefined && tx !== null ? tx : g.dbl;
        dbOrTx.events.add({
            season: g.season,
            type,
            text,
            pids,
            tids,
        });
    }

    if (showNotification) {
        let title;
        if (type === "error") {
            title = "Error!";
        } else if (type === "changes") {
            title = "Changes since your last visit";
        }

        if (persistent && extraClass === undefined) {
            extraClass = 'notification-danger';
        }

        // Don't show non-critical notification if we're viewing a live game now
        if (location.pathname.indexOf("/live") === -1 || persistent) {
            notify(text, title, {
                extraClass,
                persistent,
            });

            // Persistent notifications are very rare and should stop game sim when displayed
            if (persistent && g.autoPlaySeasons <= 0) {
                league.setGameAttributesComplete({stopGames: true});
            }
        }
    }

    // Hacky way to make sure there is room for the multi team mode menu
    const notificationContainer = document.getElementById("notification-container");
    if (g.userTids !== undefined && g.userTids.length > 1 && !notificationContainer.classList.contains("notification-container-extra-margin-bottom")) {
        notificationContainer.classList.add("notification-container-extra-margin-bottom");
    } else if (g.userTids !== undefined && g.userTids.length === 1 && notificationContainer.classList.contains("notification-container-extra-margin-bottom")) {
        notificationContainer.classList.remove("notification-container-extra-margin-bottom");
    }
};

export default logEvent;
