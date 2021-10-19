// Adapted from https://github.com/GoogleChromeLabs/text-encode-transform-polyfill/blob/ca78bcec819b5f354550798ec0378b66d7adcc63/text-encode-transform.js by removing encoding support which we don't need

// @ts-nocheck

(function () {
	if (typeof self.TextDecoderStream === "function") {
		// The constructors exist. Assume that they work and don't replace them.
		return;
	}

	// These symbols end up being different for every realm, so mixing objects
	// created in one realm with methods created in another fails.
	const codec = Symbol("codec");
	const transform = Symbol("transform");

	class TextDecoderStream {
		constructor(label = undefined, options = undefined) {
			this[codec] = new TextDecoder(label, options);
			this[transform] = new TransformStream(
				new TextDecodeTransformer(this[codec]),
			);
		}
	}

	// ECMAScript class syntax will create getters that are non-enumerable, but we
	// need them to be enumerable in WebIDL-style, so we add them manually.
	// "readable" and "writable" are always delegated to the TransformStream
	// object. Properties specified in |properties| are delegated to the
	// underlying TextEncoder or TextDecoder.
	function addDelegatingProperties(prototype, properties) {
		for (const transformProperty of ["readable", "writable"]) {
			addGetter(prototype, transformProperty, function () {
				return this[transform][transformProperty];
			});
		}

		for (const codecProperty of properties) {
			addGetter(prototype, codecProperty, function () {
				return this[codec][codecProperty];
			});
		}
	}

	function addGetter(prototype, property, getter) {
		Object.defineProperty(prototype, property, {
			configurable: true,
			enumerable: true,
			get: getter,
		});
	}

	addDelegatingProperties(TextDecoderStream.prototype, [
		"encoding",
		"fatal",
		"ignoreBOM",
	]);

	class TextDecodeTransformer {
		constructor(decoder) {
			this._decoder = new TextDecoder(decoder.encoding, {
				fatal: decoder.fatal,
				ignoreBOM: decoder.ignoreBOM,
			});
		}

		transform(chunk, controller) {
			const decoded = this._decoder.decode(chunk, { stream: true });
			if (decoded != "") {
				controller.enqueue(decoded);
			}
		}

		flush(controller) {
			// If {fatal: false} is in options (the default), then the final call to
			// decode() can produce extra output (usually the unicode replacement
			// character 0xFFFD). When fatal is true, this call is just used for its
			// side-effect of throwing a TypeError exception if the input is
			// incomplete.
			const output = this._decoder.decode();
			if (output !== "") {
				controller.enqueue(output);
			}
		}
	}

	function exportAs(name, value) {
		// Make it stringify as [object <name>] rather than [object Object].
		value.prototype[Symbol.toStringTag] = name;
		Object.defineProperty(self, name, {
			configurable: true,
			enumerable: false,
			writable: true,
			value,
		});
	}

	exportAs("TextDecoderStream", TextDecoderStream);
})();
