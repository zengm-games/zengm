import fs from "fs";
import fse from "fs-extra";
import * as rollup from "rollup";
import build from "./buildFuncs.js";
import getSport from "./getSport.js";
import replace from "replace";
import rollupConfig from "./rollupConfig.js";

const rev = build.genRev();
console.log(rev);

const BLACKLIST = {
	ui: [/\/worker/],
	worker: [/\/ui/, /^react/],
};

const buildFile = async (name, legacy) => {
	const bundle = await rollup.rollup({
		...rollupConfig("production", BLACKLIST[name], `stats-${name}.html`),
		input: `src/${name}/index.${name === "ui" ? "tsx" : "ts"}`,
	});

	const outFile = legacy
		? `build/gen/${name}-legacy-${rev}.js`
		: `build/gen/${name}-${rev}.js`;

	await bundle.write({
		compact: true,
		file: outFile,
		format: "iife",
		indent: false,
		name,
		sourcemap: true,
	});

	// Hack because otherwise I'm somehow left with no newline before the souce map URL, which confuses Bugsnag
	replace({
		regex: ";//# sourceMappingURL",
		replacement: ";\n//# sourceMappingURL",
		paths: [outFile],
		silent: true,
	});
};

const buildJS = async () => {
	await Promise.all(["ui", "worker"].map(name => buildFile(name)));

	process.env.LEGACY = "LEGACY";
	await Promise.all(["ui", "worker"].map(name => buildFile(name, true)));
	delete process.env.LEGACY;

	build.setTimestamps(rev);
	build.minifyIndexHTML();

	const realPlayerFilenames = ["real-player-data", "real-player-stats"];
	for (const filename of realPlayerFilenames) {
		const filePath = `build/gen/${filename}.json`;
		if (fs.existsSync(filePath)) {
			const string = fs.readFileSync(filePath);
			const compressed = JSON.stringify(JSON.parse(string));
			fs.writeFileSync(filePath, compressed);

			const hash = build.fileHash(compressed);
			const newFilename = filePath.replace(".json", `-${hash}.json`);
			fse.moveSync(filePath, newFilename);

			const sport = getSport();
			if (sport === "basketball") {
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
	}
};

export default buildJS;
