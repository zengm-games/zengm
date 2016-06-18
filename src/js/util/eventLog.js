const g = require('../globals');
const bbgmNotifications = require('../lib/bbgm-notifications');

function add(ot, options) {
    options.saveToDb = options.saveToDb !== undefined ? options.saveToDb : true;
    options.showNotification = options.showNotification !== undefined ? options.showNotification : true;
    options.persistent = options.persistent !== undefined ? options.persistent : false;

    if (options.saveToDb && g.lid) { // Only save to league event log if within a league
        const dbOrTx = ot !== null ? ot : g.dbl;
        dbOrTx.events.add({
            season: g.season,
            type: options.type,
            text: options.text,
            pids: options.pids,
            tids: options.tids,
        });
    }

    if (options.showNotification) {
        let title = null;
        if (options.type === "error") {
            title = "Error!";
        } else if (options.type === "changes") {
            title = "Changes since your last visit";
        }

        // Don't show non-critical notification if we're viewing a live game now
        if (location.pathname.indexOf("/live") === -1 || options.persistent) {
            bbgmNotifications.notify(options.text, title, options.persistent);

            // Persistent notifications are very rare and should stop game sim when displayed
            if (options.persistent && g.autoPlaySeasons <= 0) {
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
