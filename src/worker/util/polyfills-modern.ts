// These are polyfills that are used everywhere, including modern browsers.

// Comments indicate where I'd have to bump minimum supported browser versions to get rid of these.

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
