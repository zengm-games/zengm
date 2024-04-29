import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import os from "node:os";

const port = 3006;

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
	".svg": "image/svg+xml",
	".webmanifest": "application/manifest+json",
	".woff": "font/woff",
	".woff2": "font/woff2",
};
const sendFile = (res, filename) => {
	const filePath = path.join("build", filename);
	if (fs.existsSync(filePath)) {
		const ext = path.extname(filename);
		if (Object.hasOwn(mimeTypes, ext)) {
			res.writeHead(200, { "Content-Type": mimeTypes[ext] });
		} else {
			console.log(`Unknown mime type for extension ${ext}`);
		}

		fs.createReadStream(filePath).pipe(res);
	} else {
		console.log(`404 ${filename}`);
		res.writeHead(404, {
			"Content-Type": "text/plain",
		});
		res.end("404 Not Found");
	}
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

const param = process.argv[2];
let exposeToNetwork = false;
if (param === "--host") {
	exposeToNetwork = true;
} else if (param !== undefined) {
	throw new Error("Invalid CLI argument");
}

// https://stackoverflow.com/a/15075395/786644
const getIpAddress = () => {
	const interfaces = os.networkInterfaces();
	for (const devName in interfaces) {
		for (const alias of interfaces[devName]) {
			if (
				alias.family === "IPv4" &&
				alias.address !== "127.0.0.1" &&
				!alias.internal
			)
				return alias.address;
		}
	}
	return "0.0.0.0";
};

server.listen(port, exposeToNetwork ? "0.0.0.0" : "localhost", () => {
	console.log(`Local: http://localhost:${port}`);
	if (exposeToNetwork) {
		console.log(`Network: http://${getIpAddress()}:${port}`);
	} else {
		console.log(`Network: use --host to expose`);
	}
});
