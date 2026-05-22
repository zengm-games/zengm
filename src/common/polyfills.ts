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

// Chrome 117, Firefox 119, Safari 17.4
// https://github.com/jimmywarting/groupby-polyfill/blob/98d3309c86c614c47cb9e90e61f2180b35e38f35/lib/polyfill.js
if (!Object.groupBy) {
	Object.groupBy = (iterable, callbackfn) => {
		const obj = Object.create(null);
		let i = 0;
		for (const value of iterable) {
			const key = callbackfn(value, i++);
			if (key in obj) {
				obj[key].push(value);
			} else {
				obj[key] = [value];
			}
		}
		return obj;
	};
}
if (!Map.groupBy) {
	Map.groupBy = (iterable, callbackfn) => {
		const map = new Map();
		let i = 0;
		for (const value of iterable) {
			const key = callbackfn(value, i++);
			const list = map.get(key);
			if (list) {
				list.push(value);
			} else {
				map.set(key, [value]);
			}
		}
		return map;
	};
}

// Chrome 145, Firefox 144, Safari 16.2
if (!Map.prototype.getOrInsert) {
	for (const Class of [Map, WeakMap]) {
		Object.defineProperty(Class.prototype, "getOrInsert", {
			value<K, V>(this: Map<K, V>, key: K, defaultValue: V): V {
				if (this.has(key)) {
					return this.get(key)!;
				}
				this.set(key, defaultValue);
				return defaultValue;
			},
			writable: true,
			enumerable: false,
			configurable: true,
		});
		Object.defineProperty(Class.prototype, "getOrInsertComputed", {
			value<K, V>(this: Map<K, V>, key: K, callback: (key: K) => V): V {
				if (this.has(key)) {
					return this.get(key)!;
				}
				const defaultValue = callback(key);
				this.set(key, defaultValue);
				return defaultValue;
			},
			writable: true,
			enumerable: false,
			configurable: true,
		});
	}
}

// Chrome 110, Safari 16
if (!Array.prototype.toSorted) {
	Object.defineProperty(Array.prototype, "toSorted", {
		value<T>(this: Array<T>, compareFn?: (a: T, b: T) => number): T[] {
			return [...this].sort(compareFn);
		},
		writable: true,
		enumerable: false,
		configurable: true,
	});
}

// Chrome ?, Firefox 148, Safari ?
type IterValue<T> =
	T extends Iterable<infer U> ? U : T extends Iterator<infer U> ? U : never;
type ZipValues<T extends readonly unknown[]> = {
	[K in keyof T]: IterValue<T[K]>;
};
declare global {
	interface IteratorConstructor {
		zip<const T extends readonly Iterable<unknown>[]>(
			iterables: T,
			options?: {
				mode: "shortest" | "strict";
			},
		): IterableIterator<ZipValues<T>>;
	}
}
if (!Iterator.zip) {
	Iterator.zip = (iterables, options) => {
		const mode = options?.mode ?? "shortest";
		const iters = iterables.map((iterable) => iterable[Symbol.iterator]());

		if (iters.length === 0) {
			return {
				next() {
					return {
						value: undefined,
						done: true,
					};
				},
				[Symbol.iterator]() {
					return this;
				},
			};
		}

		return {
			next() {
				let done = false;
				let strictError = false;
				const value = [];
				for (const [i, iter] of iters.entries()) {
					const result = iter.next();
					if (result.done) {
						done = true;
						break;
					} else {
						value[i] = result.value;
					}
				}

				if (done) {
					// Extra pass to close all and handle strict errors
					if (mode === "shortest") {
						for (const [i, iter] of iters.entries()) {
							// We know the one that was done is already closed
							if (i !== value.length) {
								iter.return?.();
							}
						}
					} else {
						for (const [i, iter] of iters.entries()) {
							if (i < value.length) {
								// Iterator was not done if there is an entry in value, this is an error!
								strictError = true;
								iter.return?.();
							} else if (i === value.length) {
								// We know the one that was done is already closed
							} else {
								// Make sure any subsequent iterators are done too at the same time, if not it's an error
								const result = iter.next();
								if (!result.done) {
									iter.return?.();
									strictError = true;
								}
							}
						}
					}
				}

				if (strictError) {
					throw new TypeError("Iterables do not have the same length");
				}

				if (done) {
					return { done: true, value: undefined };
				} else {
					return { done: false, value };
				}
			},
			return(value?: unknown) {
				for (const iter of iters) {
					iter.return?.();
				}
				return { value, done: true };
			},
			throw(error?: unknown) {
				for (const iter of iters) {
					iter.throw?.(error);
				}
				throw error;
			},
			[Symbol.iterator]() {
				return this;
			},
		} as any;
	};
}
