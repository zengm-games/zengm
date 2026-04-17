import fs from "node:fs/promises";
import path from "node:path";
import { minify } from "html-minifier-terser";
import { type ReplaceInfo } from "./replace.ts";
import { bySport } from "../lib/bySport.ts";
import { getBannerAdsCode } from "./getBannerAdsCode.ts";
import type { Sport } from "../lib/getSport.ts";

const genModulepreloads = async (modulepreloadPaths: string[]) => {
	const infos = [];
	for (const modulepreloadPath of modulepreloadPaths) {
		infos.push({
			path: modulepreloadPath,
			size: (await fs.stat(path.join("build", modulepreloadPath))).size,
		});
	}

	// Largest ones first, so they start loading earlier
	infos.sort((a, b) => b.size - a.size);

	return infos
		.map((info) => {
			return `<link rel="modulepreload" href="${info.path}">`;
		})
		.join("");
};

export const buildIndexHtml = async ({
	cssReplaces,
	modulepreloadPaths,
	signal,
	sport,
	versionNumber,
	watch,
}: { sport: Sport; versionNumber: string } & (
	| {
			cssReplaces?: undefined;
			modulepreloadPaths?: undefined;
			signal: AbortSignal;
			watch: true;
	  }
	| {
			cssReplaces: ReplaceInfo[];
			modulepreloadPaths: string[];
			signal?: undefined;
			watch: false;
	  }
)) => {
	let contents = await fs.readFile("public/index.html", "utf8");

	if (signal?.aborted) {
		return;
	}

	const allReplaces = [
		...(cssReplaces ?? []),
		{
			searchValue: "MODULEPRELOADS",
			replaceValue: modulepreloadPaths
				? await genModulepreloads(modulepreloadPaths)
				: "",
		},
		...(watch
			? [
					{
						searchValue: "-VERSION_NUMBER.js",
						replaceValue: ".js",
					},
					{
						searchValue: '-" + bbgmVersion + "',
						replaceValue: "",
					},
					{
						searchValue: /-CSS_HASH_(LIGHT|DARK)/g,
						replaceValue: "",
					},
				]
			: []),
		{
			searchValue: "VERSION_NUMBER",
			replaceValue: versionNumber,
		},
		{
			searchValue: "BANNER_ADS_CODE",
			replaceValue: getBannerAdsCode(sport),
		},
		{
			searchValue: "GOOGLE_ANALYTICS_ID",
			replaceValue: bySport(sport, {
				basketball: "G-8MW4G9YRJK",
				football: "G-B5MWX6ZDK2",
				default: "G-27QV0377Q1",
			}),
		},
		{
			searchValue: "BUGSNAG_API_KEY",
			replaceValue: bySport(sport, {
				baseball: "37b1fd32d021f7716dc0e1d4a3e619bc",
				basketball: "c10b95290070cb8888a7a79cc5408555",
				football: "fed8957cbfca2d1c80997897b840e6cf",
				hockey: "449e8ed576f7cbccf5c7649e936ab9ff",
			}),
		},
		{
			searchValue: "GAME_NAME",
			replaceValue: bySport(sport, {
				baseball: "ZenGM Baseball",
				basketball: "Basketball GM",
				football: "Football GM",
				hockey: "ZenGM Hockey",
			}),
		},
		{
			searchValue: "SPORT",
			replaceValue: bySport(sport, {
				baseball: "baseball",
				basketball: "basketball",
				football: "football",
				hockey: "hockey",
			}),
		},
		{
			searchValue: "GOOGLE_ANALYTICS_COOKIE_DOMAIN",
			replaceValue: bySport(sport, {
				basketball: "basketball-gm.com",
				football: "football-gm.com",
				default: "zengm.com",
			}),
		},
		{
			searchValue: "WEBSITE_ROOT",
			replaceValue: bySport(sport, {
				baseball: "zengm.com/baseball",
				basketball: "basketball-gm.com",
				football: "football-gm.com",
				hockey: "zengm.com/hockey",
			}),
		},
		{
			searchValue: "PLAY_SUBDOMAIN",
			replaceValue: bySport(sport, {
				baseball: "baseball.zengm.com",
				basketball: "play.basketball-gm.com",
				football: "play.football-gm.com",
				hockey: "hockey.zengm.com",
			}),
		},
		{
			searchValue: "BETA_SUBDOMAIN",
			replaceValue: bySport(sport, {
				baseball: "beta.baseball.zengm.com",
				basketball: "beta.basketball-gm.com",
				football: "beta.football-gm.com",
				hockey: "beta.hockey.zengm.com",
			}),
		},
	];

	for (const { searchValue, replaceValue } of allReplaces) {
		contents = contents.replaceAll(searchValue, replaceValue);
	}

	const minified = await minify(contents, {
		collapseBooleanAttributes: true,
		collapseWhitespace: true,
		minifyCSS: true,
		minifyJS: true,
		removeComments: true,
		useShortDoctype: true,
	});

	if (signal?.aborted) {
		return;
	}

	await fs.writeFile("build/index.html", minified, { signal });
};
