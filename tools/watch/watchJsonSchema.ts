import fs from "node:fs/promises";
import { makeNormalWatcher } from "./makeNormalWatcher.ts";

// https://ar.al/2021/02/22/cache-busting-in-node.js-dynamic-esm-imports/
const importFresh = async (modulePath: string) => {
	const cacheBustingModulePath = `${modulePath}?update=${Date.now()}`;
	return await import(cacheBustingModulePath);
};

const outFilename = "build/files/league-schema.json";

export const watchJsonSchema = makeNormalWatcher({
	build: async (sport, signal) => {
		// Dynamically reload generateJsonSchema, cause that's what we're watching!
		const { generateJsonSchema } = await importFresh(
			"../build/generateJsonSchema.ts",
		);
		if (signal.aborted) {
			return;
		}

		const jsonSchema = generateJsonSchema(sport);
		const output = JSON.stringify(jsonSchema);

		await fs.mkdir("build/files", { recursive: true });
		if (signal.aborted) {
			return;
		}

		await fs.writeFile(outFilename, output, {
			signal,
		});
	},
	outFilename,
	watchFiles: "tools/build/generateJsonSchema.ts",
});

// watchJsonSchema((filename) => console.log('updateStart', filename), (filename) => console.log('updateEnd', filename), (filename, error) => console.log('updateError', filename, error));
