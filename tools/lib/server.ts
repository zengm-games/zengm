import { createReadStream, existsSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import os from "node:os";
import { styleText } from "node:util";
import type { AddressInfo } from "node:net";

const DEFAULT_PORT = 3000;

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

	// Not worth the confusion unless the service worker is being worked on
	//"/sw.js",
];

const styleUrl = (url: string) => {
	const parts = url.split(":");
	if (parts.length === 3) {
		return `${styleText("cyan", `${parts[0]!}:${parts[1]!}:`)}${styleText("cyanBright", parts[2]!)}`;
	}
	return styleText("cyan", url);
};

const listen = (server: http.Server, host: string, port: number) =>
	new Promise((resolve, reject) => {
		const onError = (error: any) => {
			server.off("listening", onListening);

			if (error.code === "EADDRINUSE") {
				resolve(false);
			} else {
				reject(error);
			}
		};

		const onListening = () => {
			server.off("error", onError);
			resolve(true);
		};

		server.once("error", onError);
		server.once("listening", onListening);
		server.listen(port, host);
	});

const listenOnAvailablePort = async (server: http.Server, host: string) => {
	const NUM_PORTS_TO_TRY = 100;
	const maxPort = DEFAULT_PORT + NUM_PORTS_TO_TRY - 1;
	for (let port = DEFAULT_PORT; port <= maxPort; port++) {
		if (await listen(server, host, port)) {
			return port;
		}
	}

	// Fall back to arbitrary port
	await listen(server, host, 0);
	const { port } = server.address() as AddressInfo;
	return port;
};

export const startServer = async ({
	exposeToNetwork,
	waitForBuild,
}: {
	exposeToNetwork: boolean;
	waitForBuild: (() => Promise<void> | undefined) | undefined;
}) => {
	const server = http.createServer(async (req, res) => {
		if (waitForBuild) {
			const wait = waitForBuild();
			if (wait) {
				await wait;
			}
		}

		const { pathname } = new URL(req.url!, localUrl);

		if (PREFIXES_STATIC.some((prefix) => pathname.startsWith(prefix))) {
			showStatic(pathname, res);
		} else {
			showIndex(res);
		}
	});

	const port = await listenOnAvailablePort(
		server,
		exposeToNetwork ? "0.0.0.0" : "localhost",
	);
	const localUrl = `http://localhost:${port}`;

	console.log("🏀🏈 ZenGM dev server ⚾🏒\n");
	console.log(`> Local: ${styleUrl(localUrl)}`);
	if (exposeToNetwork) {
		console.log(`> Network: ${styleUrl(`http://${getIpAddress()}:${port}`)}`);
	} else {
		console.log(`> Network: ${styleText("dim", "use --host to expose")}`);
	}
};
