// These are polyfills that are used everywhere, including modern browsers.

// Comments indicate where I'd have to bump minimum supported browser versions to get rid of these.

// Chrome 92, Firefox 92, Safari ??
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
for (const C of [Array, String]) {
	Object.defineProperty(C.prototype, "at", {
		value: at,
		writable: true,
		enumerable: false,
		configurable: true,
	});
}

// Chrome 71, Firefox ??, Safari 14.1
import "./polyfill-TextEncoderDecoderStream";

// Not supported in any Firefox yet!
import {
	ReadableStream as PolyfillReadableStream,
	TransformStream as PolyfillTransformStream,
	WritableStream as PolyfillWritableStream,
} from "web-streams-polyfill/ponyfill/es6";

import {
	createReadableStreamWrapper,
	createTransformStreamWrapper,
} from "@mattiasbuelens/web-streams-adapter";

export let toPolyfillReadable: (stream: ReadableStream) => ReadableStream;
export let toPolyfillTransform: (stream: TransformStream) => TransformStream;

// It's all or nothing for stream polyfills, because native methods return native streams which do not play nice with the polyfill streams.
if (!self.WritableStream || !self.TransformStream) {
	self.ReadableStream = PolyfillReadableStream as any;
	self.TransformStream = PolyfillTransformStream as any;
	self.WritableStream = PolyfillWritableStream;

	toPolyfillReadable = createReadableStreamWrapper(
		PolyfillReadableStream,
	) as any;
	toPolyfillTransform = createTransformStreamWrapper(
		PolyfillTransformStream as any,
	) as any;
} else {
	toPolyfillReadable = x => x;
	toPolyfillTransform = x => x;
}

// Needed for some reason
export default 1;
