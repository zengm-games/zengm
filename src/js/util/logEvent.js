// @flow

import g from '../globals';
import * as league from '../worker/core/league';
import notify from '../lib/bbgm-notifications';

type EventType = (
    'achievement' |
    'award' |
    'changes' |
    'draft' |
    'error' |
    'freeAgent' |
    'gameLost' |
    'gameWon' |
    'hallOfFame' |
    'healed' |
    'injured' |
    'playerFeat' |
    'playoffs' |
    'reSigned' |
    'refuseToSign' |
    'release' |
    'retired' |
    'screenshot' |
    'trade' |
    'tragedy'
);

// Really, pids, tids, and type should not be optional if saveToDb is true
type LogEventOptions = {
    extraClass?: string,
    persistent: boolean,
    pids?: number[],
    saveToDb: boolean,
    showNotification: boolean,
    text: string,
    tids?: number[],
    type: EventType,
};

const saveEvent = (event: {
    type: EventType,
    text: string,
    pids: number[],
    tids: number[],
}) => {
    if (g.cache) {
        g.cache.add('events', Object.assign({}, event, {season: g.season}));
    }
};

const showEvent = ({
    extraClass,
    persistent,
    text,
    type,
}: {
    extraClass?: string,
    persistent: boolean,
    text: string,
    type: string,
}) => {
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
    if (!location.pathname.includes('/live') || persistent) {
        notify(text, title, {
            extraClass,
            persistent,
        });

        // Persistent notifications are very rare and should stop game sim when displayed
        if (persistent && g.autoPlaySeasons <= 0) {
            league.setGameAttributes({stopGames: true});
        }
    }

    // Hacky way to make sure there is room for the multi team mode menu
    const notificationContainer = document.getElementById("notification-container");
    if (g.userTids !== undefined && g.userTids.length > 1 && notificationContainer && !notificationContainer.classList.contains("notification-container-extra-margin-bottom")) {
        notificationContainer.classList.add("notification-container-extra-margin-bottom");
    } else if (g.userTids !== undefined && g.userTids.length === 1 && notificationContainer && notificationContainer.classList.contains("notification-container-extra-margin-bottom")) {
        notificationContainer.classList.remove("notification-container-extra-margin-bottom");
    }
};

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

export default logEvent;
