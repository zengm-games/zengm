(function () {
    "use strict";

    var Event, getAll, IDBIndex, IDBObjectStore, IDBRequest;

    IDBObjectStore = window.IDBObjectStore || window.webkitIDBObjectStore || window.mozIDBObjectStore || window.msIDBObjectStore;
    IDBIndex = window.IDBIndex || window.webkitIDBIndex || window.mozIDBIndex || window.msIDBIndex;

    if (typeof IDBObjectStore.prototype.getAll !== "undefined" && typeof IDBIndex.prototype.getAll !== "undefined") {
        return;
    }

    // https://github.com/axemclion/IndexedDBShim/blob/gh-pages/src/IDBRequest.js
    IDBRequest = function () {
        this.onsuccess = null;
        this.readyState = "pending";
    };
    // https://github.com/axemclion/IndexedDBShim/blob/gh-pages/src/Event.js
    Event = function (type, debug) {
        return {
            "type": type,
            debug: debug,
            bubbles: false,
            cancelable: false,
            eventPhase: 0,
            timeStamp: new Date()
        };
    };

    getAll = function (key) {
        var request, result;

        key = typeof key !== "undefined" ? key : null;

        request = new IDBRequest();
        result = [];

        // this is either an IDBObjectStore or an IDBIndex, depending on the context.
        this.openCursor(key).onsuccess = function (event) {
            var cursor, e, target;

            cursor = event.target.result;
            if (cursor) {
                result.push(cursor.value);
                cursor.continue();
            } else {
                if (typeof request.onsuccess === "function") {
                    e = new Event("success");
                    e.target = {
                        readyState: "done",
                        result: result
                    };
                    request.onsuccess(e);
                }
            }
        };

        return request;
    };

    if (typeof IDBObjectStore.prototype.getAll === "undefined") {
        IDBObjectStore.prototype.getAll = getAll;
    }
    if (typeof IDBIndex.prototype.getAll === "undefined") {
        IDBIndex.prototype.getAll = getAll;
    }
}());