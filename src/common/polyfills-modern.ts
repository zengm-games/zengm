// These are polyfills that are used everywhere, including modern browsers.

// Comments indicate where I'd have to bump minimum supported browser versions to get rid of these.

// Needed to mirror polyfills.ts
export const toPolyfillReadable: (
	stream: ReadableStream,
) => ReadableStream = x => x;
export const toPolyfillTransform: (
	stream: TransformStream,
) => TransformStream = x => x;

// Needed for some reason
export default 1;
