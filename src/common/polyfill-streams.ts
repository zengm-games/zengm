// These are loaded async in the UI because they are kind of large and only used in 2 specific places. Would be nice to do the same in the worker, when Firefox supports worker modules.

import {
	CountQueuingStrategy as PolyfillCountQueuingStrategy,
	ReadableStream as PolyfillReadableStream,
	TransformStream as PolyfillTransformStream,
	WritableStream as PolyfillWritableStream,
} from "web-streams-polyfill/ponyfill/es6";

export const POLYFILL_STREAMS = !self.WritableStream || !self.TransformStream;

// It's all or nothing for stream polyfills, because native methods return native streams which do not play nice with the polyfill streams.
if (POLYFILL_STREAMS) {
	// Chrome 67, Firefox 102, Safari 14.1 (those are for TransformStream, which was the last implemented in some browsers, so that's the cutoff for removing all of these polyfills)
	self.ReadableStream = PolyfillReadableStream as any;
	self.TransformStream = PolyfillTransformStream as any;
	self.WritableStream = PolyfillWritableStream;
}

// Chrome 59
if (self.CountQueuingStrategy === undefined) {
	self.CountQueuingStrategy = PolyfillCountQueuingStrategy;
}

// Chrome 71, Firefox ??, Safari 14.1
import "./polyfill-TextEncoderDecoderStream";
