import { Dropbox, DropboxAuth } from "dropbox";
import { bySport } from "../../common";

// Client ID aka app key
const CLIENT_ID = bySport({
	basketball: "fvdi8cdcwscxt5j",
	football: "lqbn33k6vre8tla",
	hockey: "h4v41smg906nbpy",
});

export const getAuthenticationUrl = async (lid: number) => {
	const dropboxAuth = new DropboxAuth({ clientId: CLIENT_ID });

	// https://dropbox.github.io/dropbox-sdk-js/global.html#getAuthenticationUrl
	const redirectUri = `${window.location.origin}/dropbox`;
	const state = `${lid}`;
	const authUrl = (await dropboxAuth.getAuthenticationUrl(
		redirectUri,
		state,
	)) as string;

	return authUrl;
};

class Buffer {
	MAX_BUFFER_SIZE: number;

	dropbox: Dropbox;
	lid: number;

	buffer: Uint8Array[];
	bufferSize: number;
	uploadedSize: number;

	sessionID: string | undefined;

	constructor(dropbox: Dropbox, lid: number) {
		// 8Mb - Dropbox JavaScript API suggested max file / chunk size
		this.MAX_BUFFER_SIZE = 8 * 1000 * 1000;

		this.dropbox = dropbox;
		this.lid = lid;

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
			this.sessionID = response.result.session_id;
		} else {
			const cursor = this.getCursor();
			await this.dropbox.filesUploadSessionAppendV2({
				cursor: cursor,
				close: false,
				contents: blob,
			});
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

/*class BufferFake {
	MAX_BUFFER_SIZE: number;

	decoder: TextDecoder;

	buffer: Uint8Array[];
	bufferSize: number;
	uploadedSize: number;

	constructor(accessToken: string) {
		// 8Mb - Dropbox JavaScript API suggested max file / chunk size
		this.MAX_BUFFER_SIZE = 8 * 1000 * 1000;

		this.decoder = new TextDecoder("utf-8");

		this.buffer = [];
		this.bufferSize = 0;
	}

	async add(chunk: Uint8Array) {
		// console.log('add', this.decoder.decode(chunk));
		// console.log('add BufferFake');
		this.bufferSize += chunk.byteLength;
		this.buffer.push(chunk);

		if (this.bufferSize >= this.MAX_BUFFER_SIZE) {
			await this.flush();
		}
	}

	async flush() {
		console.log('flush BufferFake', new Date());

		await new Promise((resolve) => {
			setTimeout(resolve, 10000);
		});

		this.buffer = [];
		this.bufferSize = 0;
	}

	async finalize() {
		await this.flush();
	}
}*/

const handleAuthError = async (
	stream: WritableStream,
	error: any,
	lid: number,
) => {
	console.log(error.status, error.message, error.error);
	if (error.status === 401) {
		// "Response failed with a 401 code" - need user to log in again
		localStorage.removeItem("dropboxAccessToken");
		stream.abort(error.message);

		const url = await getAuthenticationUrl(lid);

		window.location.href = url;

		return true;
	}

	return false;
};

// Based on https://github.com/dropbox/dropbox-sdk-js/blob/b75b1e3bfedcf4b00f613489c5291d3235f052db/examples/javascript/upload/index.html
export const dropboxStream = async ({
	accessToken,
	filename,
	lid,
	onAbortDone,
	onComplete,
}: {
	accessToken: string;
	filename: string;
	lid: number;
	onAbortDone: () => void;
	onComplete: (url: string | undefined) => void;
}) => {
	const dropbox = new Dropbox({
		accessToken,
	});

	const buffer = new Buffer(dropbox, lid);

	const stream = new WritableStream({
		async write(chunk) {
			try {
				await buffer.add(chunk);
			} catch (error) {
				if (!handleAuthError(stream, error, lid)) {
					throw error;
				}
			}
		},
		async close() {
			const path = `/${filename}`;

			try {
				await buffer.finalize(path);

				let fileURL: string | undefined;

				try {
					const response2 = await dropbox.sharingCreateSharedLinkWithSettings({
						path,
					});
					fileURL = response2.result.url;
				} catch (error) {
					if (error.status === 409) {
						// "Response failed with a 409 code" - shared link already exists, and the URL is in this object!
						fileURL =
							error?.error?.error?.shared_link_already_exists?.metadata?.url;
					}

					// Other situations could lead to a 409, such as if the user has not verified their email address https://discord.com/channels/@me/913081687586537503/916208729546977310 - for now, don't worry about that, just leave fileURL blank and show a generic message about it.
				}

				const downloadURL = fileURL?.replace("https://www.", "https://dl.");
				onComplete(downloadURL);
			} catch (error) {
				if (!handleAuthError(stream, error, lid)) {
					throw error;
				}
			}
		},
		abort() {
			onAbortDone();
		},
	});

	return stream;
};
