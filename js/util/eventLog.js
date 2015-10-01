/**
 * @name util.eventLog
 * @namespace Event log.
 */
define(["dao", "globals", "lib/bbgm-notifications"], function (dao, g, bbgmNotifications) {
    "use strict";

    function add(ot, options) {
        var notificationContainer, title;

        options.saveToDb = options.saveToDb !== undefined ? options.saveToDb : true;
        options.showNotification = options.showNotification !== undefined ? options.showNotification : true;
        options.persistent = options.persistent !== undefined ? options.persistent : false;

        if (options.saveToDb && g.lid) { // Only save to league event log if within a league
            dao.events.add({
                ot: ot,
                value: {
                    season: g.season,
                    type: options.type,
                    text: options.text,
                    pids: options.pids,
                    tids: options.tids
                }
            });
        }

        if (options.showNotification) {
            title = null;
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
                    require("core/league").setGameAttributes(null, {stopGames: true});
                }
            }
        }

        // Hacky way to make sure there is room for the multi team mode menu
        notificationContainer = document.getElementById("notification-container");
        if (g.userTids !== undefined && g.userTids.length > 1 && !notificationContainer.classList.contains("notification-container-extra-margin-bottom")) {
            notificationContainer.classList.add("notification-container-extra-margin-bottom");
        } else if (g.userTids !== undefined && g.userTids.length === 1 && notificationContainer.classList.contains("notification-container-extra-margin-bottom")) {
            notificationContainer.classList.remove("notification-container-extra-margin-bottom");
        }
    }

    return {
        add: add
    };
});