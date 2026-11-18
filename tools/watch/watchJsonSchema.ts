import {
	JSON_SCHEMA_FILENAME,
	writeJsonSchemaFile,
} from "../build/createJsonSchemaFile.ts";
import { makeNormalWatcher } from "./makeNormalWatcher.ts";

// https://ar.al/2021/02/22/cache-busting-in-node.js-dynamic-esm-imports/
const importFresh = async (modulePath: string) => {
	const cacheBustingModulePath = `${modulePath}?update=${Date.now()}`;
	return await import(cacheBustingModulePath);
};

export const watchJsonSchema = makeNormalWatcher({
	build: async (sport, signal) => {
		// Dynamically reload generateJsonSchema, cause that's what we're watching!
		const { generateJsonSchema } = await importFresh(
			"../build/generateJsonSchema.ts",
		);
		if (signal.aborted) {
			return;
		}

		await writeJsonSchemaFile(generateJsonSchema(sport), signal);
	},
	outFilename: JSON_SCHEMA_FILENAME,
	watchFiles: "tools/build/generateJsonSchema.ts",
});

// watchJsonSchema((filename) => console.log('updateStart', filename), (filename) => console.log('updateEnd', filename), (filename, error) => console.log('updateError', filename, error));
