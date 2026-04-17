import { build } from "rolldown";
import workboxBuild from "workbox-build";

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
	await build({
		input: "build/sw.js",
		output: {
			externalLiveBindings: false,
			file: "build/sw.js",
			format: "iife",
			minify: true,
			sourcemap: true,
			comments: false,
		},
		preserveEntrySignatures: false,
		transform: {
			define: {
				"process.env.NODE_ENV": JSON.stringify("production"),
			},
		},
		checks: {
			pluginTimings: false,
		},
	});
};

export const buildSw = async () => {
	await injectManifest();
	await bundle();
};
