(function () {
	"use strict";

	var Event, IDBObjectStore, IDBRequest;

	IDBObjectStore = window.IDBObjectStore || window.webkitIDBObjectStore || window.mozIDBObjectStore || window.msIDBObjectStore;

	if (typeof IDBObjectStore.prototype.getAll !== "undefined") {
		return;
	}

	// https://github.com/axemclion/IndexedDBShim/blob/gh-pages/src/IDBRequest.js
	IDBRequest = function () {
	    this.onsuccess = this.onerror = this.result = this.error = this.source = this.transaction = null;
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

	IDBObjectStore.prototype.getAll = function (key) {
		var objectStore, request, result;

		key = typeof key !== "undefined" ? key : null;

		request = new IDBRequest();
		objectStore = this;
		result = [];

		objectStore.openCursor(key).onsuccess = function (event) {
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
}());