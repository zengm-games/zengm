const rollup = require("rollup");
const build = require("./lib/buildFuncs");
const getSport = require("./lib/getSport");
const rollupConfig = require("./lib/rollupConfig");

console.log("Bundling JavaScript files...");

const rev = build.genRev();
console.log(rev);

const sport = getSport();

const BLACKLIST = {
	ui: [/\/worker/],
	worker: [/\/ui/, /^react/],
};

const buildFile = async (name, legacy) => {
	const bundle = await rollup.rollup({
		...rollupConfig("production", BLACKLIST[name], `stats-${name}.html`),
		input: `src/${sport}/${name}/index.ts`,
	});

	const outFile = legacy
		? `build/gen/${name}-legacy-${rev}.js`
		: `build/gen/${name}-${rev}.js`;

	await bundle.write({
		compact: true,
		file: outFile,
		format: "iife",
		indent: false,
		name,
		sourcemap: true,
	});
};

(async () => {
	try {
		await Promise.all(["ui", "worker"].map(name => buildFile(name)));

		process.env.LEGACY = "LEGACY";
		await Promise.all(["ui", "worker"].map(name => buildFile(name, true)));
		delete process.env.LEGACY;

		build.setTimestamps(rev);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
})();
