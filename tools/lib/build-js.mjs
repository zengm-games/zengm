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
		input: {
			[name]: `src/${name}/index.${name === "ui" ? "tsx" : "ts"}`,
		},
		preserveEntrySignatures: false,
	});

	await bundle.write({
		compact: true,
		format: legacy ? "system" : "es",
		indent: false,
		sourcemap: true,
		entryFileNames: `[name]-${legacy ? "legacy-" : ""}${rev}.js`,
		chunkFileNames: `chunk-${legacy ? "legacy-" : ""}[hash].js`,
		dir: "build/gen",
	});
};

const buildJS = async () => {
	await Promise.all(["ui", "worker"].map(name => buildFile(name)));

	process.env.LEGACY = "LEGACY";
	await Promise.all(["ui", "worker"].map(name => buildFile(name, true)));
	delete process.env.LEGACY;

	// Hack because otherwise I'm somehow left with no newline before the souce map URL, which confuses Bugsnag
	const replacePaths = fs.readdirSync("build/gen").filter(filename => filename.endsWith(".js")).map(filename => `build/gen/${filename}`);
	replace({
		regex: ";//# sourceMappingURL",
		replacement: ";\n//# sourceMappingURL",
		paths: replacePaths,
		silent: true,
	});

	build.setTimestamps(rev);
	build.minifyIndexHTML();

	const jsonFiles = ["names", "real-player-data", "real-player-stats"];
	for (const filename of jsonFiles) {
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
