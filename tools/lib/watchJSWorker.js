const { parentPort, workerData } = require("worker_threads");
const esbuild = require("esbuild");
const alias = require("esbuild-plugin-alias");
const path = require("path");
const fs = require("fs/promises");
const babel = require("@babel/core");
const babelPluginSyntaxTypescript = require("@babel/plugin-syntax-typescript");
const babelPluginSportFunctions = require("../babel-plugin-sport-functions");
const getSport = require("./getSport");

const babelCache = {};

// Use babel to run babel-plugin-sport-functions. This is needed because the way bySport is defined, the sport-specific code will run if it's present, which can produce errors. It's not actually needed for isSport.
const pluginSportFunctions = {
	name: "sport-functions",
	setup(build) {
		build.onLoad({ filter: /\.tsx?$/, namespace: "file" }, async args => {
			const loader = args.path.endsWith("tsx") ? "tsx" : "ts";

			const { mtimeMs } = await fs.stat(args.path);
			if (babelCache[args.path] && babelCache[args.path].mtimeMs === mtimeMs) {
				return babelCache[args.path].result;
			}

			const text = await fs.readFile(args.path, "utf8");

			let contents;
			if (text.includes("bySport")) {
				const result = await babel.transformAsync(text, {
					babelrc: false,
					configFile: false,
					sourceMaps: "inline",
					plugins: [
						[babelPluginSyntaxTypescript, { isTSX: true }],
						babelPluginSportFunctions,
					],
				});
				contents = result.code;
			} else {
				contents = text;
			}

			const result = { contents, loader };

			babelCache[args.path] = {
				mtimeMs,
				result,
			};

			return result;
		});
	},
};

// No built-in way to identify when a rebuild starts, so do this
const pluginStartTime = infile => {
	const filter = new RegExp(infile.replace(".", "\\."));
	return {
		name: "start-time",
		setup(build) {
			build.onResolve({ filter, namespace: "file" }, () => {
				parentPort.postMessage({
					type: "start",
				});
			});
		},
	};
};

(async () => {
	const { name } = workerData;

	const infile = `src/${name}/index.${name === "ui" ? "tsx" : "ts"}`;
	const outfile = `build/gen/${name}.js`;

	const sport = getSport();

	await esbuild.build({
		entryPoints: [infile],
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
					"../../src/worker/data/names.json",
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
			pluginStartTime(infile),
			pluginSportFunctions,
		],
		watch: {
			onRebuild(error) {
				if (error) {
					parentPort.postMessage({
						type: "error",
						error,
					});
				} else {
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
