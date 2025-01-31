import fs from "node:fs/promises";
import { buildCss } from "./buildCss.ts";
import { buildJs } from "./buildJs.ts";
import { buildSw } from "./buildSw.ts";
import { copyFiles } from "./copyFiles.ts";
import { generateJsonSchema } from "./generateJsonSchema.ts";
import { getSport } from "./getSport.ts";
import { minifyIndexHtml } from "./minifyIndexHtml.ts";
import { reset } from "./reset.ts";

export default async () => {
	const sport = getSport();

	console.log(`Building ${sport}...`);

	await reset();
	await copyFiles();

	const jsonSchema = generateJsonSchema(sport);
	await fs.mkdir("build/files", { recursive: true });
	await fs.writeFile(
		"build/files/league-schema.json",
		JSON.stringify(jsonSchema, null, 2),
	);

	console.log("Bundling JavaScript files...");
	await buildJs();

	console.log("Processing CSS/HTML files...");
	await buildCss();
	await minifyIndexHtml();

	console.log("Generating sw.js...");
	await buildSw();
};
