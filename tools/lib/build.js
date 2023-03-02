import fs from "fs/promises";
import {
	buildCSS,
	copyFiles,
	getSport,
	minifyIndexHTML,
	reset,
} from "./buildFuncs.js";
import generateJSONSchema from "./generateJSONSchema.js";
import buildJS from "./build-js.js";
import buildSW from "./build-sw.js";

export default async () => {
	const sport = getSport();

	console.log(`Building ${sport}...`);

	reset();
	copyFiles();

	const jsonSchema = generateJSONSchema(sport);
	await fs.mkdir("build/files", { recursive: true });
	await fs.writeFile(
		"build/files/league-schema.json",
		JSON.stringify(jsonSchema, null, 2),
	);

	console.log("Bundling JavaScript files...");
	await buildJS();

	console.log("Processing CSS/HTML files...");
	await buildCSS();
	await minifyIndexHTML();

	console.log("Generating sw.js...");
	await buildSW();
};
