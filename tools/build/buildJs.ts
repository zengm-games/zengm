import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { Worker } from "node:worker_threads";
import { fileHash } from "./fileHash.ts";
import { generateVersionNumber } from "./generateVersionNumber.ts";
import { replace } from "./replace.ts";
import { setTimestamps } from "./setTimestamps.ts";

const versionNumber = generateVersionNumber();
console.log(versionNumber);

export const buildJs = async () => {
	const promises = [];
	for (const name of ["ui", "worker"]) {
		promises.push(
			new Promise<void>((resolve) => {
				const worker = new Worker(
					new URL("buildJsWorker.ts", import.meta.url),
					{
						workerData: {
							name,
							versionNumber,
						},
					},
				);

				worker.on("message", () => {
					resolve();
				});
			}),
		);
	}
	await Promise.all(promises);

	// Hack because otherwise I'm somehow left with no newline before the souce map URL, which confuses Bugsnag
	const replacePaths = (await fs.readdir("build/gen"))
		.filter((filename) => filename.endsWith(".js"))
		.map((filename) => `build/gen/${filename}`);
	await replace({
		paths: replacePaths,
		replaces: [
			{
				searchValue: ";//# sourceMappingURL",
				replaceValue: ";\n//# sourceMappingURL",
			},
		],
	});

	await setTimestamps(versionNumber);

	const jsonFiles = [
		"names",
		"names-female",
		"real-player-data",
		"real-player-stats",
	];
	const replaces = [];
	for (const filename of jsonFiles) {
		const filePath = `build/gen/${filename}.json`;
		if (existsSync(filePath)) {
			const string = await fs.readFile(filePath, "utf8");
			const compressed = JSON.stringify(JSON.parse(string));

			const hash = fileHash(compressed);
			const newFilename = filePath.replace(".json", `-${hash}.json`);
			await fs.rm(filePath);
			await fs.writeFile(newFilename, compressed);

			replaces.push({
				searchValue: `/gen/${filename}.json`,
				replaceValue: `/gen/${filename}-${hash}.json`,
			});
		}
	}
	await replace({
		paths: [`build/gen/worker-${versionNumber}.js`],
		replaces,
	});
};
