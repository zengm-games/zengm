import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { bySport } from "../lib/bySport.ts";
import { replace } from "./replace.ts";
import { getSport } from "../lib/getSport.ts";

const setSport = async (signal?: AbortSignal) => {
	await replace({
		paths: ["build/index.html"],
		replaces: [
			{
				searchValue: "GAME_NAME",
				replaceValue: bySport({
					baseball: "ZenGM Baseball",
					basketball: "Basketball GM",
					football: "Football GM",
					hockey: "ZenGM Hockey",
				}),
			},
			{
				searchValue: "SPORT",
				replaceValue: bySport({
					baseball: "baseball",
					basketball: "basketball",
					football: "football",
					hockey: "hockey",
				}),
			},
			{
				searchValue: "GOOGLE_ANALYTICS_COOKIE_DOMAIN",
				replaceValue: bySport({
					basketball: "basketball-gm.com",
					football: "football-gm.com",
					default: "zengm.com",
				}),
			},
			{
				searchValue: "WEBSITE_ROOT",
				replaceValue: bySport({
					baseball: "zengm.com/baseball",
					basketball: "basketball-gm.com",
					football: "football-gm.com",
					hockey: "zengm.com/hockey",
				}),
			},
			{
				searchValue: "PLAY_SUBDOMAIN",
				replaceValue: bySport({
					baseball: "baseball.zengm.com",
					basketball: "play.basketball-gm.com",
					football: "play.football-gm.com",
					hockey: "hockey.zengm.com",
				}),
			},
			{
				searchValue: "BETA_SUBDOMAIN",
				replaceValue: bySport({
					baseball: "beta.baseball.zengm.com",
					basketball: "beta.basketball-gm.com",
					football: "beta.football-gm.com",
					hockey: "beta.hockey.zengm.com",
				}),
			},
		],
		signal,
	});
};

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

	const realPlayerFilenames = ["real-player-data", "real-player-stats"];
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

	await setSport(signal);
};
