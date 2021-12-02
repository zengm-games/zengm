import { Dropbox, DropboxAuth } from "dropbox";

// Client ID aka app key
const CLIENT_ID = "fvdi8cdcwscxt5j";

class Buffer {
	MAX_BUFFER_SIZE: number;

	dropbox: Dropbox;

	buffer: Uint8Array[];
	bufferSize: number;
	uploadedSize: number;

	sessionID: string | undefined;

	constructor(accessToken: string) {
		// 8Mb - Dropbox JavaScript API suggested max file / chunk size
		this.MAX_BUFFER_SIZE = 8 * 1000 * 1000;

		this.dropbox = new Dropbox({
			accessToken,
		});

		this.buffer = [];
		this.bufferSize = 0;
		this.uploadedSize = 0;
	}

	async add(chunk: Uint8Array) {
		this.bufferSize += chunk.byteLength;
		this.buffer.push(chunk);

		if (this.bufferSize >= this.MAX_BUFFER_SIZE) {
			await this.flush();
		}
	}

	private getCursor() {
		if (this.sessionID === undefined) {
			throw new Error("No sessionID");
		}
		return { session_id: this.sessionID, offset: this.uploadedSize };
	}

	async flush() {
		const blob = new Blob(this.buffer);

		if (this.sessionID === undefined) {
			const response = await this.dropbox.filesUploadSessionStart({
				close: false,
				contents: blob,
			});
			console.log("first", response);
			this.sessionID = response.result.session_id;
		} else {
			const cursor = this.getCursor();
			const response = await this.dropbox.filesUploadSessionAppendV2({
				cursor: cursor,
				close: false,
				contents: blob,
			});
			console.log("append", response);
		}

		this.buffer = [];
		this.uploadedSize += this.bufferSize;
		this.bufferSize = 0;
	}

	async finalize(path: string) {
		if (this.sessionID === undefined) {
			await this.flush();
		}

		const blob = new Blob(this.buffer);

		const cursor = this.getCursor();
		const commit = { path, autorename: true };
		const response = await this.dropbox.filesUploadSessionFinish({
			cursor: cursor,
			commit: commit,
			contents: blob,
		});

		return response;
	}
}

// Based on https://github.com/dropbox/dropbox-sdk-js/blob/b75b1e3bfedcf4b00f613489c5291d3235f052db/examples/javascript/upload/index.html
export const dropboxStream = async (filename: string, accessToken: string) => {
	const buffer = new Buffer(accessToken);

	const stream = new WritableStream({
		async write(chunk) {
			await buffer.add(chunk);
		},
		async close() {
			const response = await buffer.finalize(`/${filename}`);
			console.log(response);
		},
	});

	return stream;
};

export const getAuthenticationUrl = async (lid: number) => {
	const dropboxAuth = new DropboxAuth({ clientId: CLIENT_ID });

	// https://dropbox.github.io/dropbox-sdk-js/global.html#getAuthenticationUrl
	const redirectUri = "http://localhost/dropbox";
	const state = `${lid}`;
	const authUrl = (await dropboxAuth.getAuthenticationUrl(
		redirectUri,
		state,
	)) as string;

	return authUrl;
};
