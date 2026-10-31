import fs from "node:fs/promises";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { fileHash } from "./fileHash.ts";
import { replace } from "./replace.ts";
import { FOLDER } from "../lib/rolldownConfig.ts";
import type { Sport } from "../lib/getSport.ts";
import { JSON_FILENAMES, jsonKeys, type JsonHashes } from "../lib/jsonUrls.ts";

// Minify the JSON files and add a hash to their filenames. This needs to happen before bundling the JS, because the hashed URLs are inserted into the bundle by rolldown.
const hashJsonFiles = async () => {
	const jsonHashes: JsonHashes = {};
	for (const key of jsonKeys) {
		const filePath = path.join("build", FOLDER, `${JSON_FILENAMES[key]}.json`);
		let string;
		try {
			string = await fs.readFile(filePath, "utf8");
		} catch (error) {
			// File doesn't exist in this sport
			if (error.code === "ENOENT") {
				continue;
			}
			throw error;
		}

		const compressed = JSON.stringify(JSON.parse(string));

		const hash = fileHash(compressed);
		const newFilename = filePath.replace(".json", `-${hash}.json`);
		await fs.rm(filePath);
		await fs.writeFile(newFilename, compressed);

		jsonHashes[key] = hash;
	}

	return jsonHashes;
};

export const buildJs = async (sport: Sport, versionNumber: string) => {
	const jsonHashes = await hashJsonFiles();

	const promises: Promise<string[]>[] = [];
	for (const name of ["ui", "worker"]) {
		promises.push(
			new Promise((resolve) => {
				const worker = new Worker(
					new URL("buildJsWorker.ts", import.meta.url),
					{
						workerData: {
							jsonHashes,
							name,
							sport,
							versionNumber,
						},
					},
				);

				worker.on("message", (modulepreloadFilenames) => {
					resolve(modulepreloadFilenames);
				});
			}),
		);
	}
	const modulepreloadPaths = (await Promise.all(promises))
		.flat()
		.map((filename) => `/${FOLDER}/${filename}`);

	// Hack because otherwise I'm somehow left with no newline before the souce map URL, which confuses Bugsnag
	const replacePaths = (await fs.readdir(path.join("build", FOLDER)))
		.filter((filename) => filename.endsWith(".js"))
		.map((filename) => path.join("build", FOLDER, filename));
	await replace({
		paths: replacePaths,
		replaces: [
			{
				searchValue: ";//# sourceMappingURL",
				replaceValue: ";\n//# sourceMappingURL",
			},
		],
	});

	return modulepreloadPaths;
};
