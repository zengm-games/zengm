// These are loaded async in the UI because they are kind of large and only used in 2 specific places

// Not supported in any Firefox yet!
import {
	CountQueuingStrategy as PolyfillCountQueuingStrategy,
	ReadableStream as PolyfillReadableStream,
	TransformStream as PolyfillTransformStream,
	WritableStream as PolyfillWritableStream,
} from "web-streams-polyfill/ponyfill/es6";

export const POLYFILL_STREAMS = !self.WritableStream || !self.TransformStream;

// It's all or nothing for stream polyfills, because native methods return native streams which do not play nice with the polyfill streams.
if (POLYFILL_STREAMS) {
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
