import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { getSport } from "../lib/getSport.ts";

export const copyFiles = async (
	watch: boolean = false,
	signal?: AbortSignal,
) => {
	const foldersToIgnore = [
		"baseball",
		"basketball",
		"css",
		"football",
		"hockey",
	];

	await fs.cp("public", "build", {
		filter: (filename) => {
			if (signal?.aborted) {
				return false;
			}

			// Handled by buildIndexHtml
			if (filename === "public/index.html") {
				return false;
			}

			// Loop through folders to ignore.
			for (const folder of foldersToIgnore) {
				if (filename.startsWith(`public/${folder}`)) {
					return false;
				}
			}

			// Remove service worker, so I don't have to deal with it being wonky in dev
			if (watch && filename === "public/sw.js") {
				return false;
			}

			return true;
		},
		recursive: true,
	});

	if (signal?.aborted) {
		return;
	}

	const sport = getSport();

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
		if (existsSync(sourcePath)) {
			await fs.copyFile(sourcePath, `build/gen/${filename}.json`);

			if (signal?.aborted) {
				return;
			}
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
	if (signal?.aborted) {
		return;
	}

	const flagHtaccess = `<IfModule mod_headers.c>
	Header set Cache-Control "public,max-age=31536000"
</IfModule>`;
	await fs.writeFile("build/img/flags/.htaccess", flagHtaccess, { signal });
	if (signal?.aborted) {
		return;
	}
};
