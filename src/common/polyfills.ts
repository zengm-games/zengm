// Comments indicate where I'd have to bump minimum supported browser versions to get rid of these.

// Chrome 92, Safari 15.4
// https://github.com/tc39/proposal-relative-indexing-method#polyfill
function at(this: any, n: number) {
	// ToInteger() abstract op
	n = Math.trunc(n) || 0;
	// Allow negative indexing from the end
	if (n < 0) {
		n += this.length;
	}
	// OOB access is guaranteed to return undefined
	if (n < 0 || n >= this.length) {
		return undefined;
	}
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

// Chrome 97, Safari 15.4
if (!Array.prototype.findLast) {
	Object.defineProperty(Array.prototype, "findLast", {
		value(cb: any) {
			for (let i = this.length - 1; i >= 0; i--) {
				if (cb(this[i])) {
					return this[i];
				}
			}
		},
		configurable: true,
		enumerable: false,
		writable: true,
	});
}

// Chrome 93, Safari 15.4
if (!Object.hasOwn) {
	Object.defineProperty(Object, "hasOwn", {
		value: (object: object, property: PropertyKey) => {
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

// Chrome 85
if (!String.prototype.replaceAll) {
	const escapeRegex = (string: string) => {
		return string.replace(/[$()*+./?[\\\]^{|}-]/g, String.raw`\$&`);
	};

	(String as any).prototype.replaceAll = function (
		str: string | RegExp,
		newStr: string,
	) {
		// If a regex pattern
		if (
			Object.prototype.toString.call(str).toLowerCase() === "[object regexp]"
		) {
			return this.replace(str, newStr);
		}

		// If a string
		return this.replace(new RegExp(escapeRegex(str as string), "g"), newStr);
	};
}

import "./polyfills-modern";
