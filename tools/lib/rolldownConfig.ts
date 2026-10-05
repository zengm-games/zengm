import path from "node:path";
import type { BuildOptions } from "rolldown";
import { getRolldownTarget } from "./browserslist.ts";
import { type Sport } from "./getSport.ts";
import { jsonUrlsDefine, type JsonHashes } from "./jsonUrls.ts";
// @ts-expect-error
import blacklist from "rollup-plugin-blacklist";
import { sentryRollupPlugin } from "@sentry/rollup-plugin";
import { visualizer } from "rollup-plugin-visualizer";
import { modulepreload } from "./rolldownPlugins/modulepreload.ts";
import { sportFunctions } from "./rolldownPlugins/sportFunctions.ts";
import { startEnd } from "./rolldownPlugins/startEnd.ts";

export const FOLDER = "gen";

export const rolldownConfig = (
	sport: Sport,
	name: "ui" | "worker",
	envOptions:
		| {
				nodeEnv: "development";
				postMessage: (message: unknown) => void;
		  }
		| {
				nodeEnv: "production";
				blacklistOptions: RegExp[];
				jsonHashes: JsonHashes;
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

	const plugins: BuildOptions["plugins"] = [
		sportFunctions(envOptions.nodeEnv, sport),
	];

	if (name === "ui" && envOptions.nodeEnv !== "test") {
		plugins.push(
			// This is only used to mark the UI bundle as first party code, for thirdPartyErrorFilterIntegration in src/ui/util/initSentry.ts. Source maps are public, so they don't need to be uploaded.
			sentryRollupPlugin({
				applicationKey: "zengm",
				release: {
					create: false,
					inject: false,
				},
				sourcemaps: {
					disable: true,
				},
				telemetry: false,

				// Otherwise it warns about not having an auth token, which is only needed for the features disabled above
				silent: true,
			}),
		);
	}

	if (envOptions.nodeEnv === "development") {
		plugins.push(
			startEnd({
				name,
				postMessage: envOptions.postMessage,
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
				__NODE_ENV: JSON.stringify(envOptions.nodeEnv),
				__SPORT: JSON.stringify(sport),
				...jsonUrlsDefine(
					envOptions.nodeEnv === "production"
						? envOptions.jsonHashes
						: undefined,
				),
			},
			jsx: "react-jsx",
			target: getRolldownTarget(),
		},
		platform: "browser",
		plugins,
		preserveEntrySignatures: false,
		checks: {
			moduleLevelDirective: false,
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
