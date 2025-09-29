import { babel } from "@rollup/plugin-babel";
// @ts-expect-error
import blacklist from "rollup-plugin-blacklist";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";
import { visualizer } from "rollup-plugin-visualizer";
import { getSport } from "./getSport.ts";
import { babelPluginSportFunctions } from "../babel-plugin-sport-functions/index.ts";
import type { RollupOptions } from "rollup";

const extensions = [".mjs", ".js", ".json", ".node", ".ts", ".tsx"];

export default (
	name: "ui" | "worker",
	envOptions:
		| {
				nodeEnv: "development";
				postMessage: (message: any) => void;
		  }
		| {
				nodeEnv: "production";
				blacklistOptions: RegExp[];
		  }
		| {
				nodeEnv: "test";
		  },
): RollupOptions => {
	const sport = getSport();

	// Not sure if this does anything
	process.env.NODE_ENV = envOptions.nodeEnv;

	const plugins = [
		replace({
			preventAssignment: true,
			values: {
				"process.env.NODE_ENV": JSON.stringify(envOptions.nodeEnv),
				"process.env.SPORT": JSON.stringify(sport),
			},
		}),
		babel({
			// Rollup plugin config
			babelHelpers: "bundled",
			exclude: "node_modules/**",
			extensions: extensions.filter((extension) => extension !== ".json"),
			skipPreflightCheck: true,

			// Babel config
			babelrc: false,
			configFile: false,
			presets: [
				[
					"@babel/preset-react",
					{
						runtime: "automatic",
					},
				],
				"@babel/preset-typescript",
			],
			plugins: [[babelPluginSportFunctions, { sport }]],
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

	if (envOptions.nodeEnv === "production") {
		plugins.splice(1, 0, blacklist(envOptions.blacklistOptions));
		plugins.push(
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
		input: {
			[name]: `src/${name}/index.${name === "ui" ? "tsx" : "ts"}`,
		},
		plugins,
		onwarn(warning: any, rollupWarn: any) {
			// I don't like this, but there's too much damn baggage
			if (warning.code === "CIRCULAR_DEPENDENCY") {
				return;
			}

			// I don't care about "use client" because I don't use RSC
			if (
				warning.code === "MODULE_LEVEL_DIRECTIVE" &&
				warning.message.includes('"use client"')
			) {
				return;
			}

			rollupWarn(warning);
			console.log(warning.code, warning);
		},
		preserveEntrySignatures: false,
	};
};
