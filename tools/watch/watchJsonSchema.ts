import { watch } from "chokidar";
import fs from "node:fs/promises";
import { type Sport } from "../lib/getSport.ts";
import { type Spinners } from "./spinners.ts";
import type { Update } from "./cli.ts";

// https://ar.al/2021/02/22/cache-busting-in-node.js-dynamic-esm-imports/
const importFresh = async (modulePath: string) => {
	const cacheBustingModulePath = `${modulePath}?update=${Date.now()}`;
	return await import(cacheBustingModulePath);
};

export const watchJsonSchema = async (
	initialSport: Sport,
	update: Update,
	eventEmitter: Spinners["eventEmitter"],
) => {
	let currentSport = initialSport;

	await fs.mkdir("build/files", { recursive: true });

	const outFilename = "build/files/league-schema.json";

	let abortController: AbortController | undefined;

	const buildJSONSchema = async (sport: Sport) => {
		try {
			abortController?.abort();
			abortController = new AbortController();
			const { signal } = abortController;

			update(outFilename, { status: "spin" });

			// Dynamically reload generateJsonSchema, cause that's what we're watching!
			const { generateJsonSchema } = await importFresh(
				"../build/generateJsonSchema.ts",
			);

			if (signal.aborted) {
				return;
			}

			const jsonSchema = generateJsonSchema(sport);
			const output = JSON.stringify(jsonSchema);
			await fs.writeFile(outFilename, output, {
				signal,
			});

			if (signal.aborted) {
				return;
			}

			update(outFilename, { status: "success" });
		} catch (error) {
			update(outFilename, { status: "error", error });
		}
	};

	const watcher = watch("tools/build/generateJsonSchema.ts", {});
	watcher.on("change", async () => {
		await buildJSONSchema(currentSport);
	});
	eventEmitter.on("newSport", async (sport) => {
		currentSport = sport;
		await buildJSONSchema(currentSport);
	});
	eventEmitter.on("switchingSport", () => {
		abortController?.abort();
	});

	await buildJSONSchema(currentSport);
};

// watchJsonSchema((filename) => console.log('updateStart', filename), (filename) => console.log('updateEnd', filename), (filename, error) => console.log('updateError', filename, error));
