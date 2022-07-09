// These are polyfills that are used everywhere, including modern browsers.

// Comments indicate where I'd have to bump minimum supported browser versions to get rid of these.

// Chrome 92, Firefox 90, Safari 15.4
// https://github.com/tc39/proposal-relative-indexing-method#polyfill
function at(this: any, n: number) {
	// ToInteger() abstract op
	n = Math.trunc(n) || 0;
	// Allow negative indexing from the end
	if (n < 0) n += this.length;
	// OOB access is guaranteed to return undefined
	if (n < 0 || n >= this.length) return undefined;
	// Otherwise, this is just normal property access
	return this[n];
}
if (!Array.prototype.at) {
	for (const C of [Array, String]) {
		Object.defineProperty(C.prototype, "at", {
			value: at,
			writable: true,
			enumerable: false,
			configurable: true,
		});
	}
}

// Chrome 93, Firefox 92, Safari 15.4
if (!Object.hasOwn) {
	Object.defineProperty(Object, "hasOwn", {
		value: function (object: object, property: PropertyKey) {
			if (object == null) {
				throw new TypeError("Cannot convert undefined or null to object");
			}
			return Object.prototype.hasOwnProperty.call(Object(object), property);
		},
		configurable: true,
		enumerable: false,
		writable: true,
	});
}

// Needed for some reason
export default 1;
