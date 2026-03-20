import { createReadStream, existsSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import os from "node:os";
import getPort from "get-port";

const mimeTypes: Record<string, string> = {
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

const BUILD_DIR = path.resolve("build");

const sendFile = (res: http.ServerResponse, filename: string) => {
	const filePath = path.resolve(BUILD_DIR, filename);

	res.setHeader("Cache-Control", "no-cache");

	if (!filePath.startsWith(BUILD_DIR)) {
		res.writeHead(403, {
			"Content-Type": "text/plain",
		});
		res.end("Forbidden");
		return;
	}

	if (existsSync(filePath)) {
		const ext = path.extname(filename);
		const mimeType = mimeTypes[ext];
		if (mimeType === undefined) {
			throw new Error(`Unknown mime type for extension ${ext}`);
		}

		res.writeHead(200, {
			"Content-Type": mimeType,
		});

		createReadStream(filePath).pipe(res);
	} else {
		console.log(`404 ${filename}`);
		res.writeHead(404, {
			"Content-Type": "text/plain",
		});
		res.end("404 Not Found");
	}
};

const showStatic = (url: string, res: http.ServerResponse) => {
	sendFile(res, url.slice(1));
};
const showIndex = (res: http.ServerResponse) => {
	sendFile(res, "index.html");
};

// https://stackoverflow.com/a/15075395/786644
const getIpAddress = () => {
	const interfaces = os.networkInterfaces();
	for (const devName in interfaces) {
		const aliases = interfaces[devName];
		if (aliases) {
			for (const alias of aliases) {
				if (
					alias.family === "IPv4" &&
					alias.address !== "127.0.0.1" &&
					!alias.internal
				) {
					return alias.address;
				}
			}
		}
	}
	return "0.0.0.0";
};

const PREFIXES_STATIC = [
	"/css/",
	"/files/",
	"/fonts/",
	"/gen/",
	"/ico/",
	"/img/",
	"/manifest",
	"/sw.js",
];

export const startServer = async ({
	exposeToNetwork,
	waitForBuild,
}: {
	exposeToNetwork: boolean;
	waitForBuild: () => Promise<void> | undefined;
}) => {
	const port = await getPort({ port: 3000 });
	const localUrl = `http://localhost:${port}`;

	const server = http.createServer(async (req, res) => {
		const wait = waitForBuild();
		if (wait) {
			await wait;
		}

		const { pathname } = new URL(req.url!, localUrl);

		if (PREFIXES_STATIC.some((prefix) => pathname.startsWith(prefix))) {
			showStatic(pathname, res);
		} else {
			showIndex(res);
		}
	});

	return new Promise<void>((resolve) => {
		server.listen(port, exposeToNetwork ? "0.0.0.0" : "localhost", () => {
			console.log(`Local: ${localUrl}`);
			if (exposeToNetwork) {
				console.log(`Network: http://${getIpAddress()}:${port}`);
			} else {
				console.log(`Network: use --host to expose`);
			}
			resolve();
		});
	});
};
