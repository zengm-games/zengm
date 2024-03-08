// Comments indicate where I'd have to bump minimum supported browser versions to get rid of these.

import {
	ReadableStream as PolyfillReadableStream,
	TransformStream as PolyfillTransformStream,
	WritableStream as PolyfillWritableStream,
} from "web-streams-polyfill";
import {
	createReadableStreamWrapper,
	createTransformStreamWrapper,
} from "@mattiasbuelens/web-streams-adapter";

// It's all or nothing for stream polyfills, because native methods return native streams which do not play nice with the polyfill streams.
const POLYFILL_STREAMS = !self.WritableStream || !self.TransformStream;
export let toPolyfillReadable: (stream: ReadableStream) => ReadableStream;
export let toPolyfillTransform: (stream: TransformStream) => TransformStream;
if (POLYFILL_STREAMS) {
	// Firefox 102, Safari 14.1 (those are for TransformStream, which was the last implemented in some browsers, so that's the cutoff for removing all of these polyfills)
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

// Chrome 92, Firefox 90, Safari 15.4
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
if (!Array.prototype.at) {
	for (const C of [Array, String]) {
		Object.defineProperty(C.prototype, "at", {
			value: at,
			writable: true,
			enumerable: false,
			configurable: true,
		});
	}
}

// Chrome 97, Firefox 104, Safari 15.4
if (!Array.prototype.findLast) {
	Object.defineProperty(Array.prototype, "findLast", {
		value: function (cb: any) {
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

// Chrome 93, Firefox 92, Safari 15.4
if (!Object.hasOwn) {
	Object.defineProperty(Object, "hasOwn", {
		value: function (object: object, property: PropertyKey) {
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

//  Firefox 105, Safari 14.1
import "./polyfill-TextEncoderDecoderStream";

// Chrome 85, Safari 13.1
if (!String.prototype.replaceAll) {
	(String as any).prototype.replaceAll = function (
		str: string | RegExp,
		newStr: string,
	) {
		// If a regex pattern
		if (
			Object.prototype.toString.call(str).toLowerCase() === "[object regexp]"
		) {
			return this.replace(str, newStr);
		}

		// If a string
		return this.replace(new RegExp(str, "g"), newStr);
	};
}

import "./polyfills-modern";
