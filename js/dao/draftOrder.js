define(["db", "lib/bluebird"], function (db, Promise) {
    "use strict";

    function get(options) {
        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;

        return new Promise(function (resolve, reject) {
            db.getObjectStore(options.ot, "messages", "messages").getAll().onsuccess = function (event) {
                resolve(event.target.result[0]);
            };
        });
    }

    return {
        get: get
    };
});