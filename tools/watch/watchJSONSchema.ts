import { watch } from "chokidar";
import fs from "node:fs";
import { getSport } from "../lib/buildFuncs.ts";

// https://ar.al/2021/02/22/cache-busting-in-node.js-dynamic-esm-imports/
const importFresh = async (modulePath: string) => {
	const cacheBustingModulePath = `${modulePath}?update=${Date.now()}`;
	return (await import(cacheBustingModulePath)).default;
};

const watchJSONSchema = async (
	updateStart: (filename: string) => void,
	updateEnd: (filename: string) => void,
	updateError: (filename: string, error: Error) => void,
) => {
	fs.mkdirSync("build/files", { recursive: true });

	const sport = getSport();

	const outFilename = "build/files/league-schema.json";

	const buildJSONSchema = async () => {
		try {
			updateStart(outFilename);

			// Dynamically reload generateJSONSchema, cause that's what we're watching!
			const generateJSONSchema = await importFresh(
				"../lib/generateJSONSchema.ts",
			);

			const jsonSchema = generateJSONSchema(sport);
			const output = JSON.stringify(jsonSchema, null, 2);
			fs.writeFileSync(outFilename, output);

			updateEnd(outFilename);
		} catch (error) {
			updateError(outFilename, error);
		}
	};

	await buildJSONSchema();

	const watcher = watch("tools/lib/generateJSONSchema.ts", {});
	watcher.on("change", buildJSONSchema);
};

// watchJSONSchema((filename) => console.log('updateStart', filename), (filename) => console.log('updateEnd', filename), (filename, error) => console.log('updateError', filename, error));

export default watchJSONSchema;
