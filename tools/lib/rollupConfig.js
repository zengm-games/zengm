const React = require("react");
const ReactDOM = require("react-dom");
const alias = require("@rollup/plugin-alias");
const babel = require("rollup-plugin-babel");
const blacklist = require("rollup-plugin-blacklist");
const commonjs = require("rollup-plugin-commonjs");
const json = require("@rollup/plugin-json"); // eslint-disable-line
const resolve = require("rollup-plugin-node-resolve");
const replace = require("@rollup/plugin-replace");
const terser = require("rollup-plugin-terser").terser;
const visualizer = require("rollup-plugin-visualizer");
const build = require("./buildFuncs");

const sport = build.getSport();

module.exports = (nodeEnv, blacklistOptions, statsFilename) => {
	const plugins = [
		alias({
			resolve: [".json"],
			entries: {
				// This is assumed to be generated prior to rollup being started
				"league-schema": `./../../../../build/files/league-schema.json`,

				// This is so Karma doesn't crash when using the big names file.
				"player-names":
					nodeEnv !== "production"
						? "./../../deion/worker/data/names-test.json"
						: "./../../basketball/worker/data/names.json",
			},
		}),
		replace({
			"process.env.NODE_ENV": JSON.stringify(nodeEnv),
			"process.env.SPORT": JSON.stringify(sport),
		}),
		babel({
			exclude: "node_modules/!(d3)**",
		}),
		json({
			compact: true,
			namedExports: false,
		}),
		commonjs({
			namedExports: {
				react: Object.keys(React),
				"react-dom": Object.keys(ReactDOM),
			},
		}),
		resolve({
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
			chokidar: true,
		},
	};
};
