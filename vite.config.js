import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
const alias = require("@rollup/plugin-alias");
const babel = require("@rollup/plugin-babel").default;
const blacklist = require("rollup-plugin-blacklist");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const resolve = require("@rollup/plugin-node-resolve").default;
const replace = require("@rollup/plugin-replace");
const terser = require("rollup-plugin-terser").terser;
const visualizer = require("rollup-plugin-visualizer").visualizer;
const getSport = require("./tools/lib/getSport");

const sport = getSport();

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		reactRefresh(),
		replace({
			preventAssignment: true,
			values: {
				"process.env.NODE_ENV": JSON.stringify("development"),
				"process.env.SPORT": JSON.stringify(sport),
			},
		}),
	],
	publicDir: "gen",
	resolve: {
		alias: {
			// This is assumed to be generated prior to rollup being started
			"league-schema": `./../../../build/files/league-schema.json`,

			"bbgm-polyfills": process.env.LEGACY
				? "./../common/polyfills.ts"
				: "./../common/polyfills-noop.ts",
		},
	},
});
