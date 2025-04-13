import { watch } from "chokidar";
import fs from "node:fs/promises";
import { getSport } from "../lib/getSport.ts";
import type { Spinners } from "./spinners.ts";

// https://ar.al/2021/02/22/cache-busting-in-node.js-dynamic-esm-imports/
const importFresh = async (modulePath: string) => {
	const cacheBustingModulePath = `${modulePath}?update=${Date.now()}`;
	return await import(cacheBustingModulePath);
};

export const watchJsonSchema = async (
	updateStart: (filename: string) => void,
	updateEnd: (filename: string) => void,
	updateError: (filename: string, error: Error) => void,
	eventEmitter: Spinners["eventEmitter"],
) => {
	await fs.mkdir("build/files", { recursive: true });

	const outFilename = "build/files/league-schema.json";

	let buildCount = 0;

	const buildJSONSchema = async () => {
		try {
			const sport = getSport();
			buildCount += 1;
			const initialBuildCount = buildCount;

			updateStart(outFilename);

			// Dynamically reload generateJsonSchema, cause that's what we're watching!
			const { generateJsonSchema } = await importFresh(
				"../build/generateJsonSchema.ts",
			);

			if (buildCount !== initialBuildCount) {
				return;
			}

			const jsonSchema = generateJsonSchema(sport);
			const output = JSON.stringify(jsonSchema, null, 2);
			await fs.writeFile(outFilename, output);

			if (buildCount !== initialBuildCount) {
				return;
			}

			updateEnd(outFilename);
		} catch (error) {
			updateError(outFilename, error);
		}
	};

	await buildJSONSchema();

	const watcher = watch("tools/build/generateJsonSchema.ts", {});
	watcher.on("change", buildJSONSchema);
	eventEmitter.on("newSport", buildJSONSchema);
};

// watchJsonSchema((filename) => console.log('updateStart', filename), (filename) => console.log('updateEnd', filename), (filename, error) => console.log('updateError', filename, error));
