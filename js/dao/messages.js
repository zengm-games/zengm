define(["globals", "lib/bluebird"], function (g, Promise) {
    "use strict";

    function getAll(options) {
        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;

        return new Promise(function (resolve, reject) {
            db.getObjectStore(options.ot, "messages", "messages").getAll().onsuccess = function (event) {
                resolve(event.target.result);
            };
        });
    }

    return {
        getAll: getAll
    };
});