import fs from "fs/promises";
import babel from "@babel/core";
import babelPluginSyntaxTypescript from "@babel/plugin-syntax-typescript";
import babelPluginSportFunctions from "../babel-plugin-sport-functions/index.cjs";
import { getSport } from "./buildFuncs.js";

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

			const isTSX = args.path.endsWith("tsx");

			const loader = isTSX ? "tsx" : "ts";

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
							[babelPluginSyntaxTypescript, { isTSX }],
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
		jsx: "automatic",
		jsxDev: nodeEnv === "development",
		define: {
			"process.env.NODE_ENV": JSON.stringify(nodeEnv),
			"process.env.SPORT": JSON.stringify(sport),
		},
		plugins: [pluginSportFunctions(nodeEnv)],

		// This is needed because dropbox conditionally requries various node builtins, and esbuild chokes on that even though it never actually makes it to the browser
		external: name === "ui" ? ["crypto", "util"] : undefined,
	};
};

export default esbuildConfig;
