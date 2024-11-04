// These are polyfills that are used everywhere, including modern browsers.

// Comments indicate where I'd have to bump minimum supported browser versions to get rid of these.

// Needed to mirror polyfills.ts
export const toPolyfillReadable: (
	stream: ReadableStream,
) => ReadableStream = x => x;
export const toPolyfillTransform: (
	stream: TransformStream,
) => TransformStream = x => x;

// Chrome 122, Firefox 127, Safari 17
// https://github.com/rauschma/set-methods-polyfill/blob/894c17391303aec7190801636c64465f653479d8/src/library.ts
if (!Set.prototype.isSubsetOf) {
	Object.defineProperty(Set.prototype, "isSubsetOf", {
		value: function <T>(a: Set<T>, b: Set<T>): boolean {
			for (const elem of a) {
				if (!b.has(elem)) {
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

// Needed for some reason
export default 1;
