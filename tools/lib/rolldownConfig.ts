import fs from "node:fs/promises";
import { stripVTControlCharacters } from "node:util";
import type { BuildOptions } from "rolldown";
import { getSport } from "./getSport.ts";
// @ts-expect-error
import blacklist from "rollup-plugin-blacklist";
import terser from "@rollup/plugin-terser";
import { visualizer } from "rollup-plugin-visualizer";
import { sportFunctions } from "./rolldownPlugins/sportFunctions.ts";
import { jsonSchema } from "./rolldownPlugins/jsonSchema.ts";

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

	if (name === "worker") {
		plugins.push(jsonSchema(envOptions.nodeEnv, sport));
	}

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
	} else if (envOptions.nodeEnv === "production") {
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
	};
};
