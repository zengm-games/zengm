// @flow

const chokidar = require("chokidar");
const fs = require("fs");
const getSport = require("./getSport");

const watchJSONSchema = () => {
	const sport = getSport();

	const watcher = chokidar.watch("tools/lib/generateJSONSchema.js", {});

	const outFilename = "build/files/league-schema.json";

	const buildJSONSchema = () => {
		const start = process.hrtime();

		// Dynamically reload generateJSONSchema, cause that's what we're watching!
		delete require.cache[require.resolve("./generateJSONSchema")];
		// eslint-disable-next-line
		const generateJSONSchema = require("./generateJSONSchema");

		const jsonSchema = generateJSONSchema(sport);
		const output = JSON.stringify(jsonSchema, null, 2);
		fs.writeFileSync(outFilename, output);

		const bytes = Buffer.byteLength(output, "utf8");

		const diff = process.hrtime(start);
		const NS_PER_SECOND = 10 ** 9;
		const timeInS = diff[0] + diff[1] / NS_PER_SECOND;

		console.log(
			`${(bytes / 1024 / 1024).toFixed(
				2,
			)} MB written to ${outFilename} (${timeInS.toFixed(
				2,
			)} seconds) at ${new Date().toLocaleTimeString()}`,
		);
	};

	buildJSONSchema();

	watcher.on("change", () => {
		// Without setTimeout, sometimes the require() would result in no function
		setTimeout(() => {
			buildJSONSchema();
		}, 10);
	});
};

module.exports = watchJSONSchema;
