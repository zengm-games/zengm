import { Dropbox } from "dropbox";

// Based on https://github.com/dropbox/dropbox-sdk-js/blob/b75b1e3bfedcf4b00f613489c5291d3235f052db/examples/javascript/upload/index.html
const dropboxStream = async (filename: string) => {
	const contents: Uint8Array[] = [];

	const dropbox = new Dropbox({
		accessToken:
			"sl.A9Yq432a95WRaR6gasrzgZrMrimioMbePN98XoeXwleX9DQPVL1_jRUHhPWngwzDaex5TsAU9dU7WXXkZj4Zi6_4ESpgwu7guEd20-HI9eeP0cJi5s_vrHMcbbpbBSMvC7F5x1g",
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
			});
			console.log(response);
		},
	});

	return stream;
};

export default dropboxStream;
