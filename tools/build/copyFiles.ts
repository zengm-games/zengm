import fs from "node:fs/promises";
import { type Sport } from "../lib/getSport.ts";

export const copyFiles = async (
	sport: Sport,
	watch: boolean = false,
	signal?: AbortSignal,
) => {
	const filesToIgnore = [
		// Handled by buildIndexHtml
		"index.html",
	];
	if (watch) {
		// Remove service worker, so I don't have to deal with it being wonky in dev
		filesToIgnore.push("sw.js");
	}

	const prefixesToIgnore = [
		"baseball",
		"basketball",
		"football",
		"hockey",

		// Handled by buildCss
		"css",
	];

	const filesIgnored = new Set();
	const prefixesIgnored = new Set();

	await fs.cp("public", "build", {
		filter: (filename) => {
			if (signal?.aborted) {
				return false;
			}

			for (const toIgnore of filesToIgnore) {
				if (filename === `public/${toIgnore}`) {
					filesIgnored.add(toIgnore);
					return false;
				}
			}
			for (const toIgnore of prefixesToIgnore) {
				if (filename.startsWith(`public/${toIgnore}`)) {
					prefixesIgnored.add(toIgnore);
					return false;
				}
			}

			return true;
		},
		recursive: true,
	});

	if (signal?.aborted) {
		return;
	}

	// Make sure all of filesToIgnore/prefixesToIgnore were actually seen - if not, probably a bug!
	const excessFilenames = filesIgnored.symmetricDifference(
		new Set(filesToIgnore),
	);
	if (excessFilenames.size !== 0) {
		throw new Error(
			`filesIgnored and filesToIgnore are not the same: ${Array.from(excessFilenames).join(", ")}`,
		);
	}
	const excessPrefixes = prefixesIgnored.symmetricDifference(
		new Set(prefixesToIgnore),
	);
	if (excessPrefixes.size !== 0) {
		throw new Error(
			`prefixesIgnored and prefixesToIgnore are not the same: ${Array.from(excessPrefixes).join(", ")}`,
		);
	}

	await fs.cp(`public/${sport}`, "build", {
		filter: (filename) => !signal?.aborted && !filename.includes(".gitignore"),
		recursive: true,
	});

	if (signal?.aborted) {
		return;
	}

	const realPlayerFilenames = [
		"real-player-data",
		"real-player-stats",
		"real-schedules",
	];
	for (const filename of realPlayerFilenames) {
		const sourcePath = `data/${filename}.${sport}.json`;
		try {
			await fs.copyFile(sourcePath, `build/gen/${filename}.json`);
		} catch (error) {
			// File doesn't exist in this sport
			if (error.code === "ENOENT") {
				continue;
			}
			throw error;
		}

		if (signal?.aborted) {
			return;
		}
	}

	await fs.copyFile("data/names.json", "build/gen/names.json");
	if (signal?.aborted) {
		return;
	}

	await fs.copyFile("data/names-female.json", "build/gen/names-female.json");
	if (signal?.aborted) {
		return;
	}

	await fs.cp("node_modules/flag-icons/flags/4x3", "build/img/flags", {
		filter: () => !signal?.aborted,
		recursive: true,
	});
};
