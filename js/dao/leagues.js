define(["globals", "lib/bluebird"], function (g, Promise) {
    "use strict";

    function getAll() {
        return new Promise(function (resolve, reject) {
            g.dbm.transaction("leagues").objectStore("leagues").getAll().onsuccess = function (event) {
                resolve(event.target.result);
            };
        });
    }

    function add(league) {
        return new Promise(function (resolve, reject) {
            g.dbm.transaction("leagues", "readwrite").objectStore("leagues").add(league).onsuccess = function (event) {
                resolve(event.target.result);
            };
        });
    }

    return {
        add: add,
        getAll: getAll
    };
});