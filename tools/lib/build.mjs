import fs from "fs/promises";
import build from "./buildFuncs.js";
import generateJSONSchema from "./generateJSONSchema.mjs";
import getSport from "./getSport.js";
import buildJS from "./build-js.mjs";
import buildSW from "./build-sw.mjs";

export default async () => {
	const sport = getSport();

	console.log(`Building ${sport}...`);

	build.reset();
	build.copyFiles();

	const jsonSchema = generateJSONSchema(sport);
	await fs.mkdir("build/files", { recursive: true });
	await fs.writeFile(
		"build/files/league-schema.json",
		JSON.stringify(jsonSchema, null, 2),
	);

	console.log("Bundling JavaScript files...");
	await buildJS();

	console.log("Processing CSS/HTML files...");
	await build.buildCSS();
	await build.minifyIndexHTML();

	console.log("Generating sw.js...");
	await buildSW();
};
