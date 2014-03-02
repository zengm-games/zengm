/**
 * @name util.eventLog
 * @namespace Event log.
 */
define(["db", "globals", "lib/bbgm-notifications"], function (db, g, bbgmNotifications) {
    "use strict";

    function add(ot, options) {
        var title;

        options.saveToDb = options.saveToDb !== undefined ? options.saveToDb : true;
        options.showNotification = options.showNotification !== undefined ? options.showNotification : true;

        if (options.saveToDb && g.lid) { // Only save to league event log if within a league
            db = require("db"); // Not sure why this is necessary
            db.getObjectStore(ot, "events", "events", true).add({
                season: g.season,
                type: options.type,
                text: options.text
            });
        }

        if (options.showNotification) {
            title = null;
            if (options.type === "error") {
                title = "Error!";
            } else if (options.type === "changes") {
                title = "Changes since your last visit";
            }

            // Don't show notification if we're viewing a live game now
            if (location.pathname.indexOf("/live") === -1) {
                bbgmNotifications.notify(options.text, title);
            }
        }
    }

    return {
        add: add
    };
});