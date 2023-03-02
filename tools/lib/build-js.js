import fs from "node:fs";
import fse from "fs-extra";
import { fileHash, genRev, setTimestamps } from "./buildFuncs.js";
import replace from "replace";
import { Worker } from "node:worker_threads";

const rev = genRev();
console.log(rev);

const buildJS = async () => {
	const promises = [];
	for (const name of ["ui", "worker"]) {
		for (const legacy of [false, true]) {
			promises.push(
				new Promise(resolve => {
					const worker = new Worker(
						new URL("./buildJSWorker.js", import.meta.url),
						{
							workerData: {
								legacy,
								name,
								rev,
							},
						},
					);

					worker.on("message", () => {
						resolve();
					});
				}),
			);
		}
	}
	await Promise.all(promises);

	// Hack because otherwise I'm somehow left with no newline before the souce map URL, which confuses Bugsnag
	const replacePaths = fs
		.readdirSync("build/gen")
		.filter(filename => filename.endsWith(".js"))
		.map(filename => `build/gen/${filename}`);
	replace({
		regex: ";//# sourceMappingURL",
		replacement: ";\n//# sourceMappingURL",
		paths: replacePaths,
		silent: true,
	});

	setTimestamps(rev);

	const jsonFiles = [
		"names",
		"names-female",
		"real-player-data",
		"real-player-stats",
	];
	for (const filename of jsonFiles) {
		const filePath = `build/gen/${filename}.json`;
		if (fs.existsSync(filePath)) {
			const string = fs.readFileSync(filePath);
			const compressed = JSON.stringify(JSON.parse(string));
			fs.writeFileSync(filePath, compressed);

			const hash = fileHash(compressed);
			const newFilename = filePath.replace(".json", `-${hash}.json`);
			fse.moveSync(filePath, newFilename);

			replace({
				regex: `/gen/${filename}.json`,
				replacement: `/gen/${filename}-${hash}.json`,
				paths: [
					`build/gen/worker-legacy-${rev}.js`,
					`build/gen/worker-${rev}.js`,
				],
				silent: true,
			});
		}
	}
};

export default buildJS;
