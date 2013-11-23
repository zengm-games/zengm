/**
 * @name core.eventLog
 * @namespace Event log.
 */
define(["db", "globals", "lib/bbgm-notifications"], function (db, g, bbgmNotifications) {
    "use strict";

    function add(ot, options) {
        var title;

        db.getObjectStore(ot, "events", "events", true).add({
            season: g.season,
            type: options.type,
            text: options.text
        });

        title = null;
        if (options.type === "injured") {
            title = "Injury!";
        }/* else if (options.type === "") {
            title = "";
        }*/

        bbgmNotifications.Notifier.notify(options.text, title);
    }

    return {
        add: add
    };
});