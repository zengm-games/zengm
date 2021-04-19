const esbuild = require("esbuild");
const alias = require("esbuild-plugin-alias");
const path = require("path");
const getSport = require("./lib/getSport");

/**
 * Currently this is not used for anything. Eventually maybe it cna replace the current rollup build script. Would need to do:
 *
 * - Run pluginSportFunctions on both isSport and bySport
 * - Do something about extra rollup plugins (like blacklist)
 * - Compare bundle size (maybe still use terser)
 * - Figure out what targets to use for the prod/legacy builds, and confirm it all works
 */

(async () => {
	const sport = getSport();

	const names = ["ui", "worker"];
	await Promise.all(
		names.map(async name => {
			await esbuild.build({
				entryPoints: [`src/${name}/index.${name === "ui" ? "tsx" : "ts"}`],
				bundle: true,
				sourcemap: true,
				inject: ["tools/lib/react-shim.js"],
				define: {
					"process.env.NODE_ENV": '"development"',
					"process.env.SPORT": JSON.stringify(sport),
				},
				outfile: `build/gen/${name}.js`,
				plugins: [
					// Not sure why this is required, docs say it should pick up on tsconfig.json settings
					alias({
						"player-names": path.join(
							__dirname,
							"../src/worker/data/names-test.json",
						),
						"league-schema": path.join(
							__dirname,
							"../build/files/league-schema.json",
						),
						"bbgm-polyfills": path.join(
							__dirname,
							"../src/common/polyfills-noop.ts",
						),
					}),
				],
			});
		}),
	);
})();
