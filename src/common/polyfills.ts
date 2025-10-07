// Comments indicate where I'd have to bump minimum supported browser versions to get rid of these.

// Chrome 92
// https://github.com/tc39/proposal-relative-indexing-method#polyfill
if (!Array.prototype.at) {
	for (const C of [Array, String]) {
		Object.defineProperty(C.prototype, "at", {
			value(this: any, n: number) {
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
			},
			writable: true,
			enumerable: false,
			configurable: true,
		});
	}
}

// Chrome 97
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

// Chrome 93
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

// Chrome 122, Firefox 127, Safari 17
// https://github.com/rauschma/set-methods-polyfill/blob/894c17391303aec7190801636c64465f653479d8/src/library.ts
type SetReadOperations<T> = {
	size: number;
	has(key: T): boolean;
	keys(): IterableIterator<T>;
};
if (!Set.prototype.intersection) {
	Object.defineProperty(Set.prototype, "intersection", {
		value<T>(this: Set<T>, other: SetReadOperations<T>): Set<T> {
			let smallerElems;
			let largerHas;
			if (this.size <= other.size) {
				smallerElems = this;
				largerHas = other;
			} else {
				smallerElems = other.keys();
				largerHas = this;
			}
			const result = new Set<T>();
			for (const elem of smallerElems) {
				if (largerHas.has(elem)) {
					result.add(elem);
				}
			}
			return result;
		},
		writable: true,
		enumerable: false,
		configurable: true,
	});
}
if (!Set.prototype.isSubsetOf) {
	Object.defineProperty(Set.prototype, "isSubsetOf", {
		value<T>(this: Set<T>, other: SetReadOperations<T>): boolean {
			for (const elem of this) {
				if (!other.has(elem)) {
					return false;
				}
			}
			return true;
		},
		writable: true,
		enumerable: false,
		configurable: true,
	});
}
if (!Set.prototype.union) {
	Object.defineProperty(Set.prototype, "union", {
		value<T>(this: Set<T>, other: SetReadOperations<T>): Set<T> {
			const result = new Set<T>(this);
			for (const elem of other.keys()) {
				result.add(elem);
			}
			return result;
		},
		writable: true,
		enumerable: false,
		configurable: true,
	});
}
