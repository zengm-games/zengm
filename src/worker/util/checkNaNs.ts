// Check all properties of an object for NaN
const checkObject = (
	obj: any,
	foundNaN?: boolean,
	replace?: boolean,
): boolean => {
	foundNaN = foundNaN ?? false;
	replace = replace ?? false;

	if (obj === null || obj === undefined) {
		return foundNaN;
	}

	for (const prop of Object.keys(obj)) {
		if (typeof obj[prop] === "object" && obj[prop] !== null) {
			foundNaN = checkObject(obj[prop], foundNaN, replace);
		} else if (Number.isNaN(obj[prop])) {
			foundNaN = true;

			if (replace) {
				obj[prop] = 0;
			}
		}
	}

	return foundNaN;
};

const wrap = (parent: any, name: any, wrapper: (x: any) => any) => {
	const original = parent[name];
	parent[name] = wrapper(original);
};

const wrapperNaNChecker = (_super: any) => {
	return function (obj: any, ...args: any[]) {
		/*if (checkObject(obj)) {
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
			checkObject(obj, false, true); // This will update obj
		}*/
		checkObject(obj, false, true); // This will update obj

		// @ts-expect-error because annotating this seems to cause runtime errors
		return _super.call(this, obj, ...args);
	};
};

export const checkNaNs = () => {
	wrap(IDBObjectStore.prototype, "add", wrapperNaNChecker);
	wrap(IDBObjectStore.prototype, "put", wrapperNaNChecker);
	wrap(IDBCursor.prototype, "update", wrapperNaNChecker);
};
