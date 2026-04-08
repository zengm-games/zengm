import fs from "node:fs/promises";
import { minify } from "html-minifier-terser";
import { type ReplaceInfo } from "./replace.ts";
import { bySport } from "../lib/bySport.ts";
import { getBannerAdsCode } from "./getBannerAdsCode.ts";

const genModulepreloads = (modulepreloadPaths: string[]) => {
	return modulepreloadPaths
		.map((path) => {
			return `<link rel="modulepreload" href="${path}">`;
		})
		.join("");
};

export const buildIndexHtml = async ({
	cssReplaces,
	modulepreloadPaths,
	signal,
	versionNumber,
	watch,
}: { versionNumber: string } & (
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
				? genModulepreloads(modulepreloadPaths)
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
			replaceValue: getBannerAdsCode(),
		},
		{
			searchValue: "GOOGLE_ANALYTICS_ID",
			replaceValue: bySport({
				basketball: "G-8MW4G9YRJK",
				football: "G-B5MWX6ZDK2",
				default: "G-27QV0377Q1",
			}),
		},
		{
			searchValue: "BUGSNAG_API_KEY",
			replaceValue: bySport({
				baseball: "37b1fd32d021f7716dc0e1d4a3e619bc",
				basketball: "c10b95290070cb8888a7a79cc5408555",
				football: "fed8957cbfca2d1c80997897b840e6cf",
				hockey: "449e8ed576f7cbccf5c7649e936ab9ff",
			}),
		},
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
