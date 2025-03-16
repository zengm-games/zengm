import fs from "node:fs/promises";
import { stripVTControlCharacters } from "node:util";
import babel from "@babel/core";
import type { RolldownPlugin, TransformResult, WatchOptions } from "rolldown";
// @ts-expect-error
import babelPluginSyntaxTypescript from "@babel/plugin-syntax-typescript";
// @ts-expect-error
import { babelPluginSportFunctions } from "../babel-plugin-sport-functions/index.js";
import { getSport } from "./getSport.ts";
import { rollupAliasEntries } from "../lib/rollupConfig.ts";

export const rolldownConfig = (
	name: "ui" | "worker",
	envOptions:
		| {
				nodeEnv: "development";
				postMessage: (message: any) => void;
		  }
		| {
				nodeEnv: "production";
		  },
): WatchOptions => {
	const infile = `src/${name}/index.${name === "ui" ? "tsx" : "ts"}`;
	const outfile = `build/gen/${name}.js`;
	const sport = getSport();

	// Result is undefined if no match, meaning just do normal stuff
	const babelCache: Record<
		string,
		| {
				mtimeMs: number;
				result: TransformResult;
		  }
		| undefined
	> = {};

	// Use babel to run babel-plugin-sport-functions. This is needed even in dev mode because the way bySport is defined, the sport-specific code will run if it's present, which can produce errors. It's not actually needed for isSport in dev mode.
	const pluginSportFunctions: RolldownPlugin = {
		name: "sport-functions",
		transform: {
			filter: {
				id: {
					include: /\.tsx?$/,
				},
			},
			async handler(code, id) {
				const { mtimeMs } = await fs.stat(id);
				const cached = babelCache[id];
				if (cached?.mtimeMs === mtimeMs) {
					return cached.result;
				}

				let result: TransformResult;
				if (
					code.includes("bySport") ||
					(envOptions.nodeEnv === "production" && code.includes("isSport"))
				) {
					const babelResult = await babel.transformAsync(code, {
						babelrc: false,
						configFile: false,
						sourceMaps: true,
						plugins: [
							[babelPluginSyntaxTypescript, { isTSX: id.endsWith(".tsx") }],
							babelPluginSportFunctions,
						],
					});

					result = {
						code: babelResult!.code!,
						map: babelResult!.map,
					};
				}

				babelCache[id] = {
					mtimeMs,
					result,
				};

				return result;
			},
		},
	};

	const plugins = [pluginSportFunctions];

	if (envOptions.nodeEnv === "development") {
		plugins.push({
			name: "start-end",

			buildStart() {
				envOptions.postMessage({
					type: "start",
				});
			},

			async buildEnd(error) {
				if (error) {
					envOptions.postMessage({
						type: "error",
						error,
					});

					const js = `throw new Error(${JSON.stringify(stripVTControlCharacters(error.message))})`;
					await fs.writeFile(outfile, js);
				}
			},

			writeBundle() {
				envOptions.postMessage({
					type: "end",
				});
			},
		});
	}

	return {
		input: infile,
		output: {
			file: outfile,
			inlineDynamicImports: true,
			sourcemap: true,

			// ES modules don't work in workers in all the browsers currently supported, otherwise could use "es" everywhere. Also at that point could evaluate things like code splitting in the worker, or code splitting between ui/worker bundles (building them together)
			// Safari 15
			format: name === "ui" ? "es" : "iife",
		},
		jsx: "react-jsx",
		define: {
			"process.env.NODE_ENV": JSON.stringify(envOptions.nodeEnv),
			"process.env.SPORT": JSON.stringify(sport),
		},
		plugins,
		resolve: {
			alias: rollupAliasEntries,
		},
	};
};
