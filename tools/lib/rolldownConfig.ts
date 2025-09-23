import fs from "node:fs/promises";
import { stripVTControlCharacters } from "node:util";
import babel from "@babel/core";
import type { BuildOptions, RolldownPlugin, TransformResult } from "rolldown";
import { and, code, include, moduleType, or } from "@rolldown/pluginutils";
// @ts-expect-error
import babelPluginSyntaxTypescript from "@babel/plugin-syntax-typescript";
import { babelPluginSportFunctions } from "../babel-plugin-sport-functions/index.ts";
import { getSport, type Sport } from "./getSport.ts";
// @ts-expect-error
import blacklist from "rollup-plugin-blacklist";
import terser from "@rollup/plugin-terser";
import { visualizer } from "rollup-plugin-visualizer";
import type { Plugin } from "rollup";

// Use babel to run babel-plugin-sport-functions. This is needed even in dev mode because the way bySport is defined, the sport-specific code will run if it's present, which can produce errors. It's not actually needed for isSport in dev mode.
const pluginSportFunctions = (
	nodeEnv: "development" | "production",
	sport: Sport,
): RolldownPlugin => {
	const babelCache: Record<
		string,
		{
			mtimeMs: number;
			result: TransformResult;
		}
	> = {};

	return {
		name: "sport-functions",
		transform: {
			filter: [
				include(
					and(
						or(moduleType("ts"), moduleType("tsx")),
						or(code("bySport"), code("isSport")),
					),
				),
			],
			async handler(code, id, { moduleType }) {
				let mtimeMs;
				if (nodeEnv === "development") {
					mtimeMs = (await fs.stat(id)).mtimeMs;
					const cached = babelCache[id];
					if (cached?.mtimeMs === mtimeMs) {
						return cached.result;
					}
				}

				const isTSX = moduleType === "tsx";

				const babelResult = await babel.transformAsync(code, {
					babelrc: false,
					configFile: false,
					sourceMaps: true,
					plugins: [
						[babelPluginSyntaxTypescript, { isTSX }],
						[babelPluginSportFunctions, { sport }],
					],
				});

				const result = {
					code: babelResult!.code!,
					map: babelResult!.map,
				};

				if (nodeEnv === "development") {
					babelCache[id] = {
						mtimeMs: mtimeMs!,
						result,
					};
				}

				return result;
			},
		},
	};
};

export const rolldownConfig = (
	name: "ui" | "worker",
	envOptions:
		| {
				nodeEnv: "development";
				postMessage: (message: unknown) => void;
		  }
		| {
				nodeEnv: "production";
				blacklistOptions: RegExp[];
				versionNumber: string;
		  },
): BuildOptions => {
	const infile = `src/${name}/index.${name === "ui" ? "tsx" : "ts"}`;
	const watchOutfile = `build/gen/${name}.js`;

	const sport = getSport();

	const plugins: (Plugin | RolldownPlugin)[] = [
		pluginSportFunctions(envOptions.nodeEnv, sport),
	];

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
					await fs.writeFile(watchOutfile, js);
				}
			},

			writeBundle() {
				envOptions.postMessage({
					type: "end",
				});
			},
		});
	} else {
		plugins.push(
			blacklist(envOptions.blacklistOptions),
			terser({
				format: {
					comments: false,
				},
			}),
			visualizer({
				filename: `stats-${name}.html`,
				gzipSize: true,
				sourcemap: true,
				template: "sunburst",
			}),
		);
	}

	return {
		input: infile,
		output: {
			...(envOptions.nodeEnv === "production"
				? {
						entryFileNames: `${name}-${envOptions.versionNumber}.js`,
						chunkFileNames: `chunk-[hash].js`,
						dir: "build/gen",
					}
				: {
						file: watchOutfile,
						inlineDynamicImports: true,
					}),
			sourcemap: true,
			externalLiveBindings: false,

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
		preserveEntrySignatures: false,
		experimental: {
			// Needed to add this when upgrading from rolldown@1.0.0-beta.31 to rolldown@1.0.0-beta.32, https://github.com/rolldown/rolldown/pull/5629 looks like the most relevant PR from that release
			strictExecutionOrder: true,
		},
	};
};
