const fs = require("fs");
const http = require("http");
const path = require("path");

const port = 3000;

const mimeTypes = {
	".bmp": "image/bmp",
	".css": "text/css",
	".gif": "image/gif",
	".html": "text/html",
	".ico": "image/x-icon",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".js": "text/javascript",
	".json": "application/json",
	".map": "application/json",
	".png": "image/png",
	".woff": "font/woff",
	".woff2": "font/woff2",
};
const sendFile = (res, filename) => {
	const ext = path.extname(filename);
	if (mimeTypes.hasOwnProperty(ext)) {
		res.writeHead(200, { "Content-Type": mimeTypes[ext] });
	} else {
		console.log(`Unknown mime type for extension ${ext}`);
	}

	fs.createReadStream(path.join(__dirname, "../build", filename)).pipe(res);
};

const showStatic = (req, res) => {
	sendFile(res, req.url.substr(1));
};
const showIndex = (req, res) => {
	sendFile(res, "index.html");
};

const startsWith = (url, prefixes) => {
	for (const prefix of prefixes) {
		if (url.indexOf(prefix) === 0) {
			return true;
		}
	}
	return false;
};

const server = http.createServer((req, res) => {
	const prefixesStatic = [
		"/css/",
		"/files/",
		"/fonts/",
		"/gen/",
		"/ico/",
		"/img/",
		"/manifest",
	];

	if (startsWith(req.url, prefixesStatic)) {
		showStatic(req, res);
	} else {
		showIndex(req, res);
	}
});

server.listen(port, "localhost", () => {
	console.log(`View Basketball GM at http://localhost:${port}`);
});
