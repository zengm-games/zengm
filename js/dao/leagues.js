define(["globals", "lib/bluebird"], function (g, Promise) {
    "use strict";

    function getAll() {
        return new Promise(function (resolve, reject) {
            g.dbm.transaction("leagues").objectStore("leagues").getAll().onsuccess = function (event) {
                resolve(event.target.result);
            };
        });
    }

    return {
        getAll: getAll
    };
});