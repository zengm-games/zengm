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

const extensions = [".mjs", ".js", ".json", ".node", ".ts", ".tsx"];

type NodeEnv = "development" | "production" | "test";

export default (
	nodeEnv: NodeEnv,
	{
		blacklistOptions,
		statsFilename,
	}: {
		blacklistOptions?: RegExp[];
		statsFilename?: string;
	} = {},
) => {
	const sport = getSport();

	// Not sure if this does anything
	process.env.NODE_ENV = nodeEnv;

	const plugins = [
		replace({
			preventAssignment: true,
			values: {
				"process.env.NODE_ENV": JSON.stringify(nodeEnv),
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
			compact: false,
			presets: [
				[
					"@babel/preset-react",
					{
						runtime: "automatic",
					},
				],
				"@babel/preset-typescript",
			],
			plugins: [babelPluginSportFunctions],
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
		watch: {
			// https://github.com/rollup/rollup/issues/1666#issuecomment-536227450
			chokidar: {
				usePolling: true,
			},
		},
	};
};
