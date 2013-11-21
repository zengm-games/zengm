/**
 * @name core.eventLog
 * @namespace Event log.
 */
define(["db", "globals", "lib/bbgm-notifications"], function (db, g, bbgmNotifications) {
    "use strict";

    function add(ot, options) {
        db.getObjectStore(ot, "events", "events", true).add({
            season: g.season,
            type: options.type,
            text: options.text
        });

        bbgmNotifications.Notifier.info(options.text, options.type);
    }

    return {
        add: add
    };
});