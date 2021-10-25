// These are loaded async in the UI because they are kind of large and only used in 2 specific places

// Not supported in any Firefox yet!
import {
	ReadableStream as PolyfillReadableStream,
	TransformStream as PolyfillTransformStream,
	WritableStream as PolyfillWritableStream,
} from "web-streams-polyfill/ponyfill/es6";

// It's all or nothing for stream polyfills, because native methods return native streams which do not play nice with the polyfill streams.
if (!self.WritableStream || !self.TransformStream) {
	self.ReadableStream = PolyfillReadableStream as any;
	self.TransformStream = PolyfillTransformStream as any;
	self.WritableStream = PolyfillWritableStream;
	self.POLYFILL_STREAMS = true;
}

// Chrome 71, Firefox ??, Safari 14.1
import "./polyfill-TextEncoderDecoderStream";
