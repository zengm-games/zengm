import fs from "node:fs/promises";
import { stripVTControlCharacters } from "node:util";
import type { BuildOptions } from "rolldown";
import { getSport } from "./getSport.ts";
// @ts-expect-error
import blacklist from "rollup-plugin-blacklist";
import { visualizer } from "rollup-plugin-visualizer";
import { sportFunctions } from "./rolldownPlugins/sportFunctions.ts";

export const rolldownConfig = (
	name: "ui" | "worker",
	envOptions:
		| {
				nodeEnv: "development";
				postMessage: (message: unknown) => void;
				signal: AbortSignal;
		  }
		| {
				nodeEnv: "production";
				blacklistOptions: RegExp[];
				versionNumber: string;
		  }
		| {
				nodeEnv: "test";
		  },
): BuildOptions => {
	const infile = `src/${name}/index.${name === "ui" ? "tsx" : "ts"}`;
	const watchOutfile = `build/gen/${name}.js`;

	const sport = getSport();

	const plugins: BuildOptions["plugins"] = [
		sportFunctions(envOptions.nodeEnv, sport),
	];

	if (envOptions.nodeEnv === "development") {
		const { postMessage, signal } = envOptions;

		plugins.push({
			name: "start-end",

			buildStart() {
				if (signal.aborted) {
					return;
				}

				postMessage({
					type: "start",
				});
			},

			async buildEnd(error) {
				if (signal.aborted) {
					return;
				}

				if (error) {
					postMessage({
						type: "error",
						error,
					});

					const js = `throw new Error(${JSON.stringify(stripVTControlCharacters(error.message))})`;
					await fs.writeFile(watchOutfile, js, { signal });
				}
			},

			// This (and all the other signal.aborted stuff in this file) is a hacky fix for https://github.com/rolldown/rolldown/issues/8937
			generateBundle(outputOptions, bundle) {
				if (signal.aborted) {
					for (const key of Object.keys(bundle)) {
						delete bundle[key];
					}
				}
			},

			writeBundle() {
				if (signal.aborted) {
					return;
				}

				postMessage({
					type: "end",
				});
			},
		});
	} else if (envOptions.nodeEnv === "production") {
		plugins.push(blacklist(envOptions.blacklistOptions));
		if (process.env.VISUALIZE) {
			plugins.push(
				visualizer({
					filename: `stats-${name}.html`,
					gzipSize: true,
					sourcemap: true,
					template: "sunburst",
				}),
			);
		}
	}

	return {
		input: infile,
		output: {
			entryFileNames:
				envOptions.nodeEnv === "production"
					? `${name}-${envOptions.versionNumber}.js`
					: `${name}.js`,
			chunkFileNames: `${name}-chunk-[hash].js`,
			dir: "build/gen",
			sourcemap: true,
			externalLiveBindings: false,
			format: "es",
			minify: true,
			comments: false,
		},
		transform: {
			define: {
				"process.env.NODE_ENV": JSON.stringify(envOptions.nodeEnv),
				"process.env.SPORT": JSON.stringify(sport),
			},
			jsx: "react-jsx",
		},
		plugins,
		preserveEntrySignatures: false,
		external(id, parentId) {
			// These are in the dropbox package but never actually get executed
			if ((id === "crypto" || id === "util") && parentId?.includes("dropbox")) {
				return true;
			}
		},
		checks: {
			pluginTimings: false,
		},
		onLog(level, log, defaultHandler) {
			// Turn warnings into errors https://rolldown.rs/reference/Interface.RolldownOptions#log
			if (level === "warn") {
				defaultHandler("error", log);
			} else {
				defaultHandler(level, log);
			}
		},
	};
};
