import fs from "node:fs/promises";
import { makeSpinners } from "./spinners.ts";
import { watchCss } from "./watchCss.ts";
import { watchFiles } from "./watchFiles.ts";
import { watchJs } from "./watchJs.ts";
import { watchJsonSchema } from "./watchJsonSchema.ts";
import { startServer } from "../lib/server.ts";
import { reset } from "../build/reset.ts";
import { parseCliParams } from "../lib/parseCliParams.ts";
import { getSport } from "../lib/getSport.ts";

const { exposeToNetwork } = parseCliParams();

const initialSport = getSport();
const spinners = makeSpinners(initialSport);

await startServer({
	exposeToNetwork,
	waitForBuild: () => spinners.waitForBuild(),
});
console.log("");

// Incremented on every update for a filename, so an async update can tell if a newer one has happened since it started
const updateCounts = new Map<string, number>();

const update = (
	filename: string,
	info:
		| {
				status: "spin";
		  }
		| {
				status: "success";
		  }
		| {
				status: "error";
				error: Error;
		  },
) => {
	const count = (updateCounts.get(filename) ?? 0) + 1;
	updateCounts.set(filename, count);

	if (info.status === "success") {
		(async () => {
			let size;
			if (filename !== "static files") {
				size = (await fs.stat(filename)).size;
			}

			if (updateCounts.get(filename) !== count) {
				return;
			}

			spinners.setStatus(filename, {
				status: "success",
				size,
			});
		})();
	} else {
		spinners.setStatus(filename, info);
	}
};
export type Update = typeof update;

// Needs to run first, to create output folder
await reset();

void watchFiles(initialSport, update, spinners.eventEmitter);

watchCss(update);

// Schema is needed for JS bundle, and watchJsonSchema is async
await watchJsonSchema(initialSport, update, spinners.eventEmitter);

watchJs(initialSport, update, spinners.eventEmitter);

spinners.initialized = true;
