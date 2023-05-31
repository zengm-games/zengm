import fs from "fs/promises";
import babel from "@babel/core";
import babelPluginSyntaxTypescript from "@babel/plugin-syntax-typescript";
import babelPluginSportFunctions from "../babel-plugin-sport-functions/index.js";
import getSport from "./getSport.js";
import path from "path";

const babelCache = {};

// Use babel to run babel-plugin-sport-functions. This is needed because the way bySport is defined, the sport-specific code will run if it's present, which can produce errors. It's not actually needed for isSport.
const pluginSportFunctions = nodeEnv => ({
	name: "sport-functions",
	setup(build) {
		build.onResolve({ filter: /\..{1,}Sport/ }, async args => {
			return {
				path: path.join(args.resolveDir, args.path) + ".ts",
				namespace: "by-sport",
			};
		});

		build.onLoad({ filter: /\.tsx?$/, namespace: "by-sport" }, async args => {
			const { mtimeMs } = await fs.stat(args.path);
			if (babelCache[args.path] && babelCache[args.path].mtimeMs === mtimeMs) {
				return babelCache[args.path].result;
			}

			const loader = args.path.endsWith("tsx") ? "tsx" : "ts";

			const text = await fs.readFile(args.path, "utf8");

			// result is undefined if no match, meaning just do normal stuff
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

			const result = { contents, loader };

			babelCache[args.path] = {
				mtimeMs,
				result,
			};

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
		plugins: [pluginSportFunctions(nodeEnv)],

		// This is needed because dropbox conditionally requries various node builtins, and esbuild chokes on that even though it never actually makes it to the browser. Skip it for the worker though, otherwise that introduces a spurious error because the type export in worker/index.ts results in a module.exports being added.
		platform: name === "ui" ? "node" : undefined,
	};
};

export default esbuildConfig;
