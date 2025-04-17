import fs from "node:fs/promises";
import { spinners } from "./spinners.ts";
import { watchCss } from "./watchCss.ts";
import { watchFiles } from "./watchFiles.ts";
import { watchJs } from "./watchJs.ts";
import { watchJsonSchema } from "./watchJsonSchema.ts";
import { startServer } from "../lib/server.ts";

const param = process.argv[2];
if (param !== "--no-server") {
	let exposeToNetwork = false;
	if (param === "--host") {
		exposeToNetwork = true;
	} else if (param !== undefined) {
		console.log(
			"Invalid CLI argument. The only valid options are --no-server and --host",
		);
		process.exit(1);
	}

	await startServer(exposeToNetwork);
	console.log("");
}

const updateStart = (filename: string) => {
	spinners.setStatus(filename, {
		status: "spin",
	});
};

const updateEnd = async (filename: string) => {
	let size;
	if (filename !== "static files") {
		size = (await fs.stat(filename)).size;
	}

	spinners.setStatus(filename, {
		status: "success",
		size,
	});
};

const updateError = (filename: string, error: Error) => {
	spinners.setStatus(filename, {
		status: "error",
		error,
	});
};

// Needs to run first, to create output folder
await watchFiles(updateStart, updateEnd, updateError, spinners.eventEmitter);

watchCss(updateStart, updateEnd, updateError);

// Schema is needed for JS bunlde, and watchJsonSchema is async
await watchJsonSchema(
	updateStart,
	updateEnd,
	updateError,
	spinners.eventEmitter,
);

watchJs(updateStart, updateEnd, updateError, spinners.eventEmitter);

spinners.initialized = true;
