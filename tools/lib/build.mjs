import fs from "fs/promises";
import { PurgeCSS } from "purgecss";
import build from "./buildFuncs.js";
import generateJSONSchema from "./generateJSONSchema.mjs";
import getSport from "./getSport.js";
import buildJS from "./build-js.mjs";
import buildSW from "./build-sw.mjs";

const doPurgeCSS = async cssFilenames => {
	console.log("cssFilenames", cssFilenames);
	const results = await new PurgeCSS().purge({
		content: ["build/gen/*.js"],
		css: cssFilenames,
		safelist: {
			greedy: [/^modal/, /^navbar/, /^popover/, /^flag-/],
		},
	});
	for (const result of results) {
		await fs.writeFile(result.file, result.css);
	}
};

export default async () => {
	const sport = getSport();

	console.log(`Building ${sport}...`);

	build.reset();
	build.copyFiles();
	const cssFilenames = build.buildCSS();

	const jsonSchema = generateJSONSchema(sport);
	await fs.mkdir("build/files", { recursive: true });
	await fs.writeFile(
		"build/files/league-schema.json",
		JSON.stringify(jsonSchema, null, 2),
	);

	console.log("Bundling JavaScript files...");
	await buildJS();

	console.log("PurgeCSS");
	await doPurgeCSS(cssFilenames);

	console.log("Generating sw.js...");
	await buildSW();
};
