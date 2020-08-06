const alias = require("@rollup/plugin-alias");
const babel = require("@rollup/plugin-babel").default;
const blacklist = require("rollup-plugin-blacklist");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const resolve = require("@rollup/plugin-node-resolve").default;
const replace = require("@rollup/plugin-replace");
const terser = require("rollup-plugin-terser").terser;
const visualizer = require("rollup-plugin-visualizer");
const getSport = require("./getSport");

const sport = getSport();

const extensions = [".mjs", ".js", ".json", ".node", ".ts", ".tsx"];

module.exports = (nodeEnv, blacklistOptions, statsFilename) => {
	const plugins = [
		alias({
			resolve: [".json"],
			entries: {
				// This is assumed to be generated prior to rollup being started
				"league-schema": `./../../../build/files/league-schema.json`,

				// This is so Karma doesn't crash when using the big names file.
				"player-names":
					nodeEnv === "test"
						? "./../data/names-test.json"
						: `./../data/names.json`,

				"bbgm-polyfills": process.env.LEGACY
					? "./../common/polyfills.ts"
					: "./../common/polyfills-noop.ts",
			},
		}),
		replace({
			"process.env.NODE_ENV": JSON.stringify(nodeEnv),
			"process.env.SPORT": JSON.stringify(sport),
		}),
		babel({
			babelHelpers: "bundled",
			exclude: "node_modules/!(d3|idb)**",
			extensions: extensions.filter(extension => extension !== ".json"),
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
				output: {
					comments: /^I DON'T WANT ANY COMMENTS$/,
				},
				safari10: true,
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
