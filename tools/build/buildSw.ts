import fs from "node:fs/promises";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import { rollup } from "rollup";
import workboxBuild from "workbox-build";
import { replace as replace2 } from "./replace.ts";

const getVersionNumber = async () => {
	const files = await fs.readdir("build/gen");
	for (const file of files) {
		if (file.startsWith("ui") && file.endsWith(".js")) {
			const filePart = file.split("-")[1];
			if (filePart !== undefined) {
				const versionNumber = filePart.replace(".js", "");
				return versionNumber;
			}
		}
	}

	throw new Error("versionNumber not found");
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
		globIgnores: ["gen/real-player-*.json", "upgrade-50/*"],

		// Changing default is only needed for unminified versions from watch-js
		maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
	});

	warnings.forEach(console.warn);
	console.log(`${count} files will be precached, totaling ${size} bytes.`);
};

const bundle = async () => {
	const bundle = await rollup({
		input: "build/sw.js",
		plugins: [
			replace({
				preventAssignment: true,
				values: {
					"process.env.NODE_ENV": JSON.stringify("production"),
				},
			}),
			resolve(),
			terser({
				format: {
					comments: false,
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

export const buildSw = async () => {
	await injectManifest();
	await bundle();

	const versionNumber = await getVersionNumber();
	await replace2({
		paths: ["build/sw.js"],
		replaces: [
			{
				searchValue: "VERSION_NUMBER",
				replaceValue: versionNumber,
			},
		],
	});
};
