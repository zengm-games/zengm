import fs from "fs";
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
	build.buildCSS();

	const jsonSchema = generateJSONSchema(sport);
	fs.mkdirSync("build/files", { recursive: true });
	fs.writeFileSync(
		"build/files/league-schema.json",
		JSON.stringify(jsonSchema, null, 2),
	);

	console.log("Bundling JavaScript files...");
	await buildJS();

	console.log("Generating sw.js...");
	await buildSW();
};
