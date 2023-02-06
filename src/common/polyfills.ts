// Comments indicate where I'd have to bump minimum supported browser versions to get rid of these.

// Chrome 69
// https://github.com/behnammodi/polyfill/blob/1a5965edc0e2eaf8e6d87902cc719462e2a889fb/array.polyfill.js#L598-L622
if (!Array.prototype.flat) {
	Object.defineProperty(Array.prototype, "flat", {
		configurable: true,
		writable: true,
		value: function () {
			const depth =
				// eslint-disable-next-line prefer-rest-params
				typeof arguments[0] === "undefined" ? 1 : Number(arguments[0]) || 0;
			const result: any[] = [];
			const forEach = result.forEach;

			const flatDeep = function (arr: any[], depth: number) {
				forEach.call(arr, function (val) {
					if (depth > 0 && Array.isArray(val)) {
						flatDeep(val, depth - 1);
					} else {
						result.push(val);
					}
				});
			};

			flatDeep(this, depth);
			return result;
		},
	});
}

import {
	ReadableStream as PolyfillReadableStream,
	TransformStream as PolyfillTransformStream,
	WritableStream as PolyfillWritableStream,
} from "web-streams-polyfill/ponyfill/es6";
import {
	createReadableStreamWrapper,
	createTransformStreamWrapper,
} from "@mattiasbuelens/web-streams-adapter";

// It's all or nothing for stream polyfills, because native methods return native streams which do not play nice with the polyfill streams.
const POLYFILL_STREAMS = !self.WritableStream || !self.TransformStream;
export let toPolyfillReadable: (stream: ReadableStream) => ReadableStream;
export let toPolyfillTransform: (stream: TransformStream) => TransformStream;
if (POLYFILL_STREAMS) {
	// Chrome 67, Firefox 102, Safari 14.1 (those are for TransformStream, which was the last implemented in some browsers, so that's the cutoff for removing all of these polyfills)
	self.ReadableStream = PolyfillReadableStream as any;
	self.TransformStream = PolyfillTransformStream as any;
	self.WritableStream = PolyfillWritableStream as any;

	toPolyfillReadable = createReadableStreamWrapper(
		PolyfillReadableStream as any,
	) as any;
	toPolyfillTransform = createTransformStreamWrapper(
		PolyfillTransformStream as any,
	) as any;
} else {
	toPolyfillReadable = x => x;
	toPolyfillTransform = x => x;
}

// Chrome 76, Safari 14.1
// Based on https://stackoverflow.com/a/65087341/786644
if (!Blob.prototype.stream) {
	(Blob as any).prototype.stream = function () {
		let offset = 0;
		const chunkSize = 64 * 1024;

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const blob = this;

		return new ReadableStream({
			pull(controller) {
				return new Promise(resolve => {
					if (offset < blob.size) {
						const blobChunk = blob.slice(offset, offset + chunkSize);
						const reader = new FileReader();
						reader.onload = event => {
							controller.enqueue((event.currentTarget as any).result);
							offset += chunkSize;
							if (offset >= blob.size) {
								controller.close();
							}
							resolve();
						};
						reader.readAsArrayBuffer(blobChunk);
					}
				});
			},
		});
	};
}

import "./polyfills-modern";
