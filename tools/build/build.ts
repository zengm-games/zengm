import { buildCss } from "./buildCss.ts";
import { buildJs } from "./buildJs.ts";
import { buildSw } from "./buildSw.ts";
import { copyFiles } from "./copyFiles.ts";
import { getSport } from "../lib/getSport.ts";
import { minifyIndexHtml } from "./minifyIndexHtml.ts";
import { reset } from "./reset.ts";
import { createJsonSchemaFile } from "./createJsonSchemaFile.ts";

export const build = async () => {
	const sport = getSport();

	console.log(`Building ${sport}...`);

	await reset();
	await copyFiles();
	await createJsonSchemaFile(sport);

	console.log("Bundling JavaScript files...");
	await buildJs();

	console.log("Processing CSS/HTML files...");
	await buildCss();
	await minifyIndexHtml();

	console.log("Generating sw.js...");
	await buildSw();
};
