define(["globals", "lib/bluebird"], function (g, Promise) {
    "use strict";

    function get(options) {
        options = options !== undefined ? options : {};
        options.key = options.key !== undefined ? options.key : null;

        return new Promise(function (resolve, reject) {
            g.dbm.transaction("leagues").objectStore("leagues").get(options.key).onsuccess = function (event) {
                resolve(event.target.result);
            };
        });
    }

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
        get: get,
        getAll: getAll
    };
});