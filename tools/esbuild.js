const esbuild = require("esbuild");
const alias = require("esbuild-plugin-alias");
const path = require("path");
const getSport = require("./lib/getSport");

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
