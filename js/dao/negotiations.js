define(["db", "lib/bluebird"], function (db, Promise) {
    "use strict";

    function getAll(options) {
        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;

        return new Promise(function (resolve, reject) {
            db.getObjectStore(options.ot, "negotiations", "negotiations").getAll().onsuccess = function (event) {
                resolve(event.target.result);
            };
        });
    }

    return {
        getAll: getAll
    };
});