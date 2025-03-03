// These are polyfills that are used everywhere, including modern browsers.

// Comments indicate where I'd have to bump minimum supported browser versions to get rid of these.

// Chrome 122, Firefox 127, Safari 17
// https://github.com/rauschma/set-methods-polyfill/blob/894c17391303aec7190801636c64465f653479d8/src/library.ts
type SetReadOperations<T> = {
	size: number;
	has(key: T): boolean;
	keys(): IterableIterator<T>;
};
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

// Needed for some reason
export default 1;
