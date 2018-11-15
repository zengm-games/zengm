// @flow

// Check all properties of an object for NaN
const checkObject = (obj, foundNaN, replace) => {
    foundNaN = foundNaN !== undefined ? foundNaN : false;
    replace = replace !== undefined ? replace : false;

    for (const prop of Object.keys(obj)) {
        if (typeof obj[prop] === "object" && obj[prop] !== null) {
            foundNaN = checkObject(obj[prop], foundNaN, replace);
            // eslint-disable-next-line no-self-compare
        } else if (obj[prop] !== obj[prop]) {
            // NaN check from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isNaN
            foundNaN = true;
            if (replace) {
                obj[prop] = 0;
            }
        }
    }

    return foundNaN;
};

const wrap = (parent: any, name, wrapper) => {
    const original = parent[name];
    parent[name] = wrapper(original);
};

const wrapperNaNChecker = _super => {
    return function(obj, ...args) {
        /* Commented out becuse I'm not sure how to make this send just once from worker
        if (checkObject(obj)) {
            const err = new Error('NaN found before writing to IndexedDB');

            notifiException in toUI does not currently exist, but it could
            toUI(['notifyException', err, 'NaNFound', {
                details: {
                    objectWithNaN: JSON.stringify(obj, (key, value) => {
                        if (Number.isNaN) {
                            return 'FUCKING NaN RIGHT HERE';
                        }

                        return value;
                    }),
                },
            }], conditions);

            // Try to recover gracefully
            checkObject(obj, false, true); // This will update obj
        }*/

        checkObject(obj, false, true); // This will update obj

        return _super.call(this, obj, ...args);
    };
};

const checkNaNs = () => {
    wrap(IDBObjectStore.prototype, "add", wrapperNaNChecker);
    wrap(IDBObjectStore.prototype, "put", wrapperNaNChecker);
    wrap(IDBCursor.prototype, "update", wrapperNaNChecker);
};

export default checkNaNs;
