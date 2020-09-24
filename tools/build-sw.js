const fs = require("fs");
const replace2 = require("replace");
const babel = require("@rollup/plugin-babel").default;
const replace = require("@rollup/plugin-replace");
const resolve = require("@rollup/plugin-node-resolve").default;
const terser = require("rollup-plugin-terser").terser;
const rollup = require("rollup");
const workboxBuild = require("workbox-build");

console.log("Generating sw.js...");

const getRev = () => {
	const files = fs.readdirSync("build/gen");
	for (const file of files) {
		if (file.endsWith(".js")) {
			const rev = file.split("-")[1].replace(".js", "");
			return rev;
		}
	}

	throw new Error("rev not found");
};

// NOTE: This should be run *AFTER* all assets are built
const injectManifest = async () => {
	const { count, size, warnings } = await workboxBuild.injectManifest({
		swSrc: "public/sw.js",
		swDest: "build/sw.js",
		globDirectory: "build",
		globPatterns: ["**/*.{js,css,html}", "fonts/*.woff2", "img/logos/*.png"],
		dontCacheBustURLsMatching: /gen\/.*\.(js|css)/,
		globIgnores: [
			"gen/*-legacy-*.js",
			"gen/real-player-data*.json",
			"upgrade-39/*",
		],

		// Changing default is only needed for unminified versions from watch-js
		maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
	});

	warnings.forEach(console.warn);
	console.log(`${count} files will be precached, totaling ${size} bytes.`);
};

const bundle = async () => {
	const bundle = await rollup.rollup({
		input: "build/sw.js",
		plugins: [
			replace({
				"process.env.NODE_ENV": JSON.stringify("production"),
			}),
			babel({
				babelHelpers: "bundled",
			}),
			resolve(),
			terser({
				output: {
					comments: /^I DON'T WANT ANY COMMENTS$/,
				},
			}),
		],
	});

	await bundle.write({
		file: `build/sw.js`,
		format: "iife",
		indent: false,
		sourcemap: true,
	});
};

(async () => {
	try {
		await injectManifest();
		await bundle();

		const rev = getRev();
		replace2({
			regex: "REV_GOES_HERE",
			replacement: rev,
			paths: ["build/sw.js"],
			silent: true,
		});
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
})();
