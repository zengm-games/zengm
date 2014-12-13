define(["db", "lib/bluebird"], function (db, Promise) {
    "use strict";

    function count(options) {
        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;

        return new Promise(function (resolve, reject) {
            db.getObjectStore(options.ot, "games", "games").count().onsuccess = function (event) {
                resolve(event.target.result);
            };
        });
    }

    return {
        count: count
    };
});