// Check all properties of an object for NaN, recursively. This runs on every object written to IndexedDB, so it needs to be fast.
const checkObject = (obj: any, replace: boolean): boolean => {
	let foundNaN = false;

	// for...in rather than Object.keys, to not allocate an array of keys for every nested object. Objects written to IndexedDB are plain data, so there are no inherited enumerable properties to skip.
	for (const prop in obj) {
		const value = obj[prop];
		if (typeof value === "object") {
			if (value !== null && checkObject(value, replace)) {
				foundNaN = true;
			}
		} else if (Number.isNaN(value)) {
			foundNaN = true;

			if (replace) {
				obj[prop] = 0;
			}
		}
	}

	return foundNaN;
};

const wrap = (parent: any, name: any, wrapper: (x: unknown) => unknown) => {
	const original = parent[name];
	parent[name] = wrapper(original);
};

const wrapperNaNChecker = (_super: unknown) => {
	return function (obj: unknown, ...args: unknown[]) {
		/*if (checkObject(obj, false)) {
			const error = new Error("NaN found before writing to IndexedDB");
			void toUI("bugsnagNotify", [
				error,
				JSON.stringify(obj, (key, value) => {
					if (Number.isNaN(value)) {
						return "FUCKING NaN RIGHT HERE";
					}
					return value;
				}),
			]);

			// Try to recover gracefully
			checkObject(obj, true); // This will update obj
		}*/
		checkObject(obj, true); // This will update obj

		// @ts-expect-error because annotating this seems to cause runtime errors
		return _super.call(this, obj, ...args);
	};
};

export const checkNaNs = () => {
	wrap(IDBObjectStore.prototype, "add", wrapperNaNChecker);
	wrap(IDBObjectStore.prototype, "put", wrapperNaNChecker);
	wrap(IDBCursor.prototype, "update", wrapperNaNChecker);
};
