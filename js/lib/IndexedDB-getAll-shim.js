// IndexedDB-getAll-shim v1.1 - https://github.com/jdscheff/IndexedDB-getAll-shim

(function () {
    "use strict";

    var Event, FDBIndex, FDBObjectStore, FDBRequest, getAll;

    FDBObjectStore = window.FDBObjectStore || window.webkitFDBObjectStore || window.mozFDBObjectStore || window.msFDBObjectStore;
    FDBIndex = window.FDBIndex || window.webkitFDBIndex || window.mozFDBIndex || window.msFDBIndex;

    if (typeof FDBObjectStore === "undefined" || typeof FDBIndex === "undefined" || (FDBObjectStore.prototype.getAll !== undefined && FDBIndex.prototype.getAll !== undefined)) {
        return;
    }

    if (FDBObjectStore.prototype.mozGetAll !== undefined && FDBIndex.prototype.mozGetAll !== undefined) {
        FDBObjectStore.prototype.getAll = FDBObjectStore.prototype.mozGetAll;
        FDBIndex.prototype.getAll = FDBIndex.prototype.mozGetAll;
        return;
    }

    // https://github.com/axemclion/IndexedDBShim/blob/gh-pages/src/FDBRequest.js
    FDBRequest = function () {
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

        request = new FDBRequest();
        result = [];

        // this is either an FDBObjectStore or an FDBIndex, depending on the context.
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

    FDBObjectStore.prototype.getAll = getAll;
    FDBIndex.prototype.getAll = getAll;
}());