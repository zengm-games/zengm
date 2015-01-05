// IndexedDB-getAll-shim v1.1 - https://github.com/jdscheff/IndexedDB-getAll-shim

(function () {
    "use strict";

    var Event, IDBIndex, IDBObjectStore, IDBRequest, getAll;

    IDBObjectStore = window.IDBObjectStore || window.webkitIDBObjectStore || window.mozIDBObjectStore || window.msIDBObjectStore;
    IDBIndex = window.IDBIndex || window.webkitIDBIndex || window.mozIDBIndex || window.msIDBIndex;

    if (typeof IDBObjectStore === "undefined" || typeof IDBIndex === "undefined" || (IDBObjectStore.prototype.getAll !== undefined && IDBIndex.prototype.getAll !== undefined)) {
        return;
    }

    if (IDBObjectStore.prototype.mozGetAll !== undefined && IDBIndex.prototype.mozGetAll !== undefined) {
        IDBObjectStore.prototype.getAll = IDBObjectStore.prototype.mozGetAll;
        IDBIndex.prototype.getAll = IDBIndex.prototype.mozGetAll;
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

        key = key !== undefined ? key : null;

        request = new IDBRequest();
        result = [];

        // this is either an IDBObjectStore or an IDBIndex, depending on the context.
        this.openCursor(key).onsuccess = function (event) {
            var cursor, e;

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

    IDBObjectStore.prototype.getAll = getAll;
    IDBIndex.prototype.getAll = getAll;
}());