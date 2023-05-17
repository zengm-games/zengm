import path from "node:path";
import alias from "@rollup/plugin-alias";
import { babel } from "@rollup/plugin-babel";
import blacklist from "rollup-plugin-blacklist";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";
import { visualizer } from "rollup-plugin-visualizer";
import { getSport } from "./buildFuncs.js";
import { getDirname } from "./getDirname.js";

const extensions = [".mjs", ".js", ".json", ".node", ".ts", ".tsx"];

export default (nodeEnv, { blacklistOptions, statsFilename, legacy } = {}) => {
	const sport = getSport();

	// This gets used in babel.config.js, except we don't want it set to "test" in karma because then it will activate @babel/plugin-transform-modules-commonjs
	if (nodeEnv !== "test") {
		process.env.NODE_ENV = nodeEnv;
	}

	const __dirname = getDirname(import.meta.url);
	const root = path.join(__dirname, "..", "..");

	const plugins = [
		alias({
			resolve: [".json"],
			entries: {
				// This is assumed to be generated prior to rollup being started
				"league-schema": path.resolve(root, "build/files/league-schema.json"),

				"bbgm-polyfills": legacy
					? path.resolve(root, "src/common/polyfills.ts")
					: path.resolve(root, "src/common/polyfills-modern.ts"),

				"bbgm-polyfills-ui": legacy
					? path.resolve(root, "src/ui/util/polyfills.ts")
					: path.resolve(root, "src/common/polyfills-noop.ts"),

				"bbgm-debug":
					nodeEnv === "production"
						? path.resolve(root, "src/worker/core/debug/prod.ts")
						: path.resolve(root, "src/worker/core/debug/index.ts"),

				"ajv-hack": path.resolve(root, "src/worker/ajvHack/esbuild.js"),
			},
		}),
		replace({
			preventAssignment: true,
			values: {
				"process.env.NODE_ENV": JSON.stringify(nodeEnv),
				"process.env.SPORT": JSON.stringify(sport),
			},
		}),
		babel({
			babelHelpers: "bundled",
			exclude: legacy
				? /^node_modules\/(?!@tanstack\/react-virtual|d3|idb|nanoevents|react-bootstrap|streamsaver?).*$/
				: "node_modules/**",
			extensions: extensions.filter(extension => extension !== ".json"),
			configFile: path.join(
				__dirname,
				`../../babel.config${legacy ? ".legacy" : ""}.js`,
			),
		}),
		json({
			compact: true,
			namedExports: false,
		}),
		commonjs(),
		resolve({
			extensions,
			preferBuiltins: true,
		}),
	];

	if (nodeEnv === "production") {
		plugins.push(
			terser({
				format: {
					comments: false,
				},
			}),
		);
	}

	if (blacklistOptions) {
		plugins.splice(1, 0, blacklist(blacklistOptions));
	}

	if (statsFilename) {
		plugins.push(
			visualizer({
				filename: statsFilename,
				gzipSize: true,
				sourcemap: true,
				template: "sunburst",
			}),
		);
	}

	return {
		plugins,
		onwarn(warning, rollupWarn) {
			// I don't like this, but there's too much damn baggage
			if (warning.code !== "CIRCULAR_DEPENDENCY") {
				rollupWarn(warning);
			}
		},
		watch: {
			// https://github.com/rollup/rollup/issues/1666#issuecomment-536227450
			chokidar: {
				usePolling: true,
			},
		},
	};
};
