import fs from "fs";
import replace2 from "replace";
import { babel } from "@rollup/plugin-babel";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import * as rollup from "rollup";
import workboxBuild from "workbox-build";

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
		globPatterns: [
			"**/*.{js,css,html}",
			"fonts/*",
			"gen/*.json",
			"img/logos-primary/*.svg",
			"img/logos-secondary/*.svg",
			"ico/icon.svg",
			"ico/logo.png",
			"ico/logo-gold.png",
		],
		dontCacheBustURLsMatching: /gen\/.*\.(js|css)/,
		globIgnores: [
			"gen/*-legacy-*.js",
			"gen/real-player-*.json",
			"upgrade-50/*",
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
				preventAssignment: true,
				values: {
					"process.env.NODE_ENV": JSON.stringify("production"),
				},
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

const buildSW = async () => {
	await injectManifest();
	await bundle();

	const rev = getRev();
	replace2({
		regex: "REV_GOES_HERE",
		replacement: rev,
		paths: ["build/sw.js"],
		silent: true,
	});
};

export default buildSW;
