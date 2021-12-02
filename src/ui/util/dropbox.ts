import { Dropbox, DropboxAuth } from "dropbox";

// Client ID aka app key
const CLIENT_ID = "fvdi8cdcwscxt5j";

// Based on https://github.com/dropbox/dropbox-sdk-js/blob/b75b1e3bfedcf4b00f613489c5291d3235f052db/examples/javascript/upload/index.html
export const dropboxStream = async (filename: string, accessToken: string) => {
	const contents: Uint8Array[] = [];

	const dropbox = new Dropbox({
		accessToken,
	});

	const stream = new WritableStream({
		write(chunk) {
			contents.push(chunk);
		},
		async close() {
			const blob = new Blob(contents, {
				type: "application/json",
			});
			const response = await dropbox.filesUpload({
				path: `/${filename}`,
				contents: blob,
				autorename: true,
			});
			console.log(response);
		},
	});

	return stream;
};

export const getAuthenticationUrl = async (lid: number) => {
	const dropboxAuth = new DropboxAuth({ clientId: CLIENT_ID });

	// https://dropbox.github.io/dropbox-sdk-js/global.html#getAuthenticationUrl - redirectUri, state, and usePKCE are the non-default ones
	const redirectUri = "http://localhost/dropbox";
	const state = `${lid}`;
	const authType = "token";
	const tokenAccessType = null;
	const scope = undefined;
	const includeGrantedScopes = "none";
	const usePKCE = true;

	const authUrl = (await dropboxAuth.getAuthenticationUrl(
		redirectUri,
		state,
		/*authType,
		tokenAccessType,
		scope,
		includeGrantedScopes,
		usePKCE,*/
	)) as string;

	return authUrl;
};
