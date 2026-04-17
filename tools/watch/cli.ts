import fs from "node:fs/promises";
import { spinners } from "./spinners.ts";
import { watchCss } from "./watchCss.ts";
import { watchFiles } from "./watchFiles.ts";
import { watchJs } from "./watchJs.ts";
import { watchJsonSchema } from "./watchJsonSchema.ts";
import { startServer } from "../lib/server.ts";
import { reset } from "../build/reset.ts";
import { parseCliParams } from "../lib/parseCliParams.ts";
import { getSport } from "../lib/getSport.ts";

const { exposeToNetwork } = parseCliParams();
await startServer({
	exposeToNetwork,
	waitForBuild: () => spinners.waitForBuild(),
});
console.log("");

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
	if (info.status === "success") {
		(async () => {
			let size;
			if (filename !== "static files") {
				size = (await fs.stat(filename)).size;
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

const initialSport = getSport();

// Needs to run first, to create output folder
await reset();

watchFiles(initialSport, update, spinners.eventEmitter);

watchCss(update);

// Schema is needed for JS bundle, and watchJsonSchema is async
await watchJsonSchema(initialSport, update, spinners.eventEmitter);

watchJs(initialSport, update, spinners.eventEmitter);

spinners.initialized = true;
