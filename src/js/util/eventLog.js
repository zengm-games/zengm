const g = require('../globals');
const bbgmNotifications = require('../lib/bbgm-notifications');

function add(ot, {
    extraClass,
    persistent = false,
    pids,
    text,
    tids,
    saveToDb = false,
    showNotification = true,
    type,
}) {
    if (saveToDb && g.lid) { // Only save to league event log if within a league
        const dbOrTx = ot !== null ? ot : g.dbl;
        dbOrTx.events.add({
            season: g.season,
            type,
            text,
            pids,
            tids,
        });
    }

    if (showNotification) {
        let title = null;
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
            bbgmNotifications.notify(text, title, {
                extraClass,
                persistent,
            });

            // Persistent notifications are very rare and should stop game sim when displayed
            if (persistent && g.autoPlaySeasons <= 0) {
                require('../core/league').setGameAttributesComplete({stopGames: true});
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
}

module.exports = {
    add,
};
