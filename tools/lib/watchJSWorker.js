const { parentPort, workerData } = require("worker_threads");
const esbuild = require("esbuild");
const alias = require("esbuild-plugin-alias");
const path = require("path");
const getSport = require("./getSport");

const fs = require("fs/promises");
const babel = require("@babel/core");
const babelPluginSportFunctions = require("../babel-plugin-sport-functions");

// Use babel to run babel-plugin-sport-functions
const pluginSportFunctions = {
	name: "plugin-sport-functions",
	setup(build) {
		build.onLoad({ filter: /\.tsx?$/ }, async args => {
			const loader = args.path.endsWith("tsx") ? "tsx" : "ts";

			const text = await fs.readFile(args.path, "utf8");
			if (!text.includes("bySport") && !text.includes("isSport")) {
				return { contents: text, loader };
			}

			const result = await babel.transformAsync(text, {
				babelrc: false,
				configFile: false,
				filename: args.path,
				plugins: [
					["@babel/plugin-syntax-typescript", { isTSX: true }],
					babelPluginSportFunctions,
				],
			});
			return { contents: result.code, loader };
		});
	},
};

(async () => {
	const { name } = workerData;

	const outfile = `build/gen/${name}.js`;

	const sport = getSport();

	parentPort.postMessage({
		type: "start",
	});

	await esbuild.build({
		entryPoints: [`src/${name}/index.${name === "ui" ? "tsx" : "ts"}`],
		bundle: true,
		sourcemap: true,
		inject: ["tools/lib/react-shim.js"],
		define: {
			"process.env.NODE_ENV": '"development"',
			"process.env.SPORT": JSON.stringify(sport),
		},
		outfile,
		plugins: [
			// Not sure why this is required, docs say it should pick up on tsconfig.json settings
			alias({
				"player-names": path.join(
					__dirname,
					"../../src/worker/data/names-test.json",
				),
				"league-schema": path.join(
					__dirname,
					"../../build/files/league-schema.json",
				),
				"bbgm-polyfills": path.join(
					__dirname,
					"../../src/common/polyfills-noop.ts",
				),
			}),
			pluginSportFunctions,
		],
		watch: {
			// https://esbuild.github.io/api/#incremental if polling watch is too slow

			onRebuild(error) {
				if (error) {
					parentPort.postMessage({
						type: "error",
						error,
					});
				} else {
					// No way to know when it started, but it's so fast it doesn't really matter
					parentPort.postMessage({
						type: "start",
					});
					parentPort.postMessage({
						type: "end",
					});
				}
			},
		},
	});

	parentPort.postMessage({
		type: "end",
	});
})();
