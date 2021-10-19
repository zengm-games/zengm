// These are polyfills that are used everywhere, including modern browsers.

// Comments indicate where I'd have to bump minimum supported browser versions to get rid of these.

// Not supported in any Firefox yet!
import {
	ReadableStream as PolyfillReadableStream,
	WritableStream as PolyfillWritableStream,
	TransformStream as PolyfillTransformStream,
} from "web-streams-polyfill/es6";

import {
	createReadableStreamWrapper,
	createWritableStreamWrapper,
	createTransformStreamWrapper,
} from "@mattiasbuelens/web-streams-adapter";
export const toPolyfillReadable = createReadableStreamWrapper(
	PolyfillReadableStream,
);
export const toPolyfillWritable = createWritableStreamWrapper(
	PolyfillWritableStream,
);
export const toPolyfillTransform = createTransformStreamWrapper(
	PolyfillTransformStream,
);

// Not supported in any Firefox yet!
import "./polyfill-TextDecoderStream";
