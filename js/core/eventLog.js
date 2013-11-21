/**
 * @name core.eventLog
 * @namespace Event log.
 */
define(["db", "globals"], function (db, g) {
    "use strict";

    function add(ot, type, text) {
        db.getObjectStore(ot, "events", "events", true).add({
            season: g.season,
            type: type,
            text: text
        });
    }

    return {
        add: add
    };
});