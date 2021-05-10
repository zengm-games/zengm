const alias = require("esbuild-plugin-alias");
const path = require("path");
const fs = require("fs/promises");
const babel = require("@babel/core");
const babelPluginSyntaxTypescript = require("@babel/plugin-syntax-typescript");
const babelPluginSportFunctions = require("../babel-plugin-sport-functions");
const getSport = require("./getSport");

const babelCache = {};

// Use babel to run babel-plugin-sport-functions. This is needed because the way bySport is defined, the sport-specific code will run if it's present, which can produce errors. It's not actually needed for isSport.
const pluginSportFunctions = nodeEnv => ({
	name: "sport-functions",
	setup(build) {
		build.onLoad({ filter: /\.tsx?$/, namespace: "file" }, async args => {
			const { mtimeMs } = await fs.stat(args.path);
			if (babelCache[args.path] && babelCache[args.path].mtimeMs === mtimeMs) {
				return babelCache[args.path].result;
			}

			const loader = args.path.endsWith("tsx") ? "tsx" : "ts";

			const text = await fs.readFile(args.path, "utf8");

			// result is undefined if no match, meaning just do normal stuff
			let result;
			if (
				text.includes("bySport") ||
				(nodeEnv === "production" && text.includes("isSport"))
			) {
				const contents = (
					await babel.transformAsync(text, {
						babelrc: false,
						configFile: false,
						sourceMaps: "inline",
						plugins: [
							[babelPluginSyntaxTypescript, { isTSX: true }],
							babelPluginSportFunctions,
						],
					})
				).code;

				result = { contents, loader };
			}

			babelCache[args.path] = {
				mtimeMs,
				result,
			};

			if (result === undefined) {
				// Might as well return the text, since we have it in memory already
				result = { contents: text, loader };
			}

			return result;
		});
	},
});

const esbuildConfig = ({ nodeEnv, name }) => {
	const infile = `src/${name}/index.${name === "ui" ? "tsx" : "ts"}`;
	const outfile = `build/gen/${name}.js`;

	const sport = getSport();

	return {
		entryPoints: [infile],
		outfile,
		bundle: true,
		sourcemap: true,
		inject: ["tools/lib/react-shim.mjs"],
		define: {
			"process.env.NODE_ENV": JSON.stringify(nodeEnv),
			"process.env.SPORT": JSON.stringify(sport),
		},
		plugins: [
			// Not sure why this is required, docs say it should pick up on tsconfig.json settings
			alias({
				"league-schema": path.join(
					__dirname,
					"../../build/files/league-schema.json",
				),
				"bbgm-polyfills": path.join(
					__dirname,
					"../../src/common/polyfills-noop.ts",
				),
				"bbgm-debug": path.join(
					__dirname,
					"../../src/worker/core/debug/index.ts",
				),
			}),
			pluginSportFunctions(nodeEnv),
		],
	};
};

module.exports = esbuildConfig;
