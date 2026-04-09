import { buildCss } from "./buildCss.ts";
import { buildJs } from "./buildJs.ts";
import { buildSw } from "./buildSw.ts";
import { copyFiles } from "./copyFiles.ts";
import { getSport } from "../lib/getSport.ts";
import { buildIndexHtml } from "./buildIndexHtml.ts";
import { reset } from "./reset.ts";
import { createJsonSchemaFile } from "./createJsonSchemaFile.ts";
import { generateVersionNumber } from "./generateVersionNumber.ts";

export const build = async () => {
	const sport = getSport();
	const versionNumber = generateVersionNumber();

	console.log(`Building ${sport} ${versionNumber}`);

	await reset();
	await copyFiles();
	await createJsonSchemaFile(sport);

	const modulepreloadPaths = await buildJs(versionNumber);

	const cssReplaces = (await buildCss()) ?? [];
	await buildIndexHtml({
		cssReplaces,
		modulepreloadPaths,
		versionNumber,
		watch: false,
	});

	await buildSw();
};
