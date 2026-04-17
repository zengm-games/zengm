import { buildCss } from "./buildCss.ts";
import { buildJs } from "./buildJs.ts";
import { buildSw } from "./buildSw.ts";
import { copyFiles } from "./copyFiles.ts";
import { buildIndexHtml } from "./buildIndexHtml.ts";
import { reset } from "./reset.ts";
import { createJsonSchemaFile } from "./createJsonSchemaFile.ts";
import { generateVersionNumber } from "./generateVersionNumber.ts";
import type { Sport } from "../lib/getSport.ts";

export const build = async (sport: Sport) => {
	const versionNumber = generateVersionNumber();

	console.log(`Building ${sport} ${versionNumber}`);

	await reset();
	await copyFiles(sport);
	await createJsonSchemaFile(sport);

	const modulepreloadPaths = await buildJs(sport, versionNumber);

	const cssReplaces = (await buildCss()) ?? [];
	await buildIndexHtml({
		cssReplaces,
		modulepreloadPaths,
		sport,
		versionNumber,
		watch: false,
	});

	await buildSw();
};
