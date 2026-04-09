import path from "node:path";
import type { BuildOptions } from "rolldown";
import { getSport } from "./getSport.ts";
// @ts-expect-error
import blacklist from "rollup-plugin-blacklist";
import { visualizer } from "rollup-plugin-visualizer";
import { modulepreload } from "./rolldownPlugins/modulepreload.ts";
import { sportFunctions } from "./rolldownPlugins/sportFunctions.ts";
import { startEnd } from "./rolldownPlugins/startEnd.ts";

export const FOLDER = "gen";

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
				onModulepreloadFilenames: (filenames: string[]) => void;
				versionNumber: string;
		  }
		| {
				nodeEnv: "test";
		  },
): BuildOptions => {
	const infile = path.join(
		"src",
		name,
		`index.${name === "ui" ? "tsx" : "ts"}`,
	);

	const sport = getSport();

	const plugins: BuildOptions["plugins"] = [
		sportFunctions(envOptions.nodeEnv, sport),
	];

	if (envOptions.nodeEnv === "development") {
		plugins.push(
			startEnd({
				name,
				postMessage: envOptions.postMessage,
				signal: envOptions.signal,
			}),
		);
	} else if (envOptions.nodeEnv === "production") {
		plugins.push(
			blacklist(envOptions.blacklistOptions),
			modulepreload(envOptions.onModulepreloadFilenames),
		);
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
			dir: path.join("build", FOLDER),
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
