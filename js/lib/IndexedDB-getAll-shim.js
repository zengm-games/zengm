(function(){
	var IDBObjectStore = window.IDBObjectStore || window.webkitIDBObjectStore || window.mozIDBObjectStore || window.msIDBObjectStore;

	if (typeof IDBObjectStore.prototype.getAll !== "undefined") {
		return;
	}

	IDBObjectStore.prototype.getAll = function (key) {
		//IDBObjectStore.prototype.openCursor(key).onsuccess = function (event) {
		//	console.log('hi');
		//}
		//this.openCursor(key)
console.log(this);
	};

	if (typeof window.IDBObjectStore !== "undefined") {
		window.IDBObjectStore = IDBObjectStore;
	} else if (typeof window.webkitIDBObjectStore !== "undefined") {
		window.webkitIDBObjectStore = IDBObjectStore;
	} else if (typeof window.mozIDBObjectStore !== "undefined") {
		window.mozIDBObjectStore = IDBObjectStore;
	} else if (typeof window.msIDBObjectStore !== "undefined") {
		window.msIDBObjectStore = IDBObjectStore;
	}
})();