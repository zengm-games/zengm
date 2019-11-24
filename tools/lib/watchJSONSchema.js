// @flow

const chokidar = require("chokidar");
const fs = require("fs");
const build = require("./buildFuncs");

const watchJSONSchema = () => {
	const sport = build.getSport();

	console.log("Watching JSON schema...");

	const watcher = chokidar.watch("tools/lib/generateJSONSchema.js", {});

	const outFilename = "build/files/league-schema.json";

	const buildJSONSchema = () => {
		const start = process.hrtime();

		// Without setTimeout, sometimes the require() would result in no function
		setTimeout(() => {
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
		}, 10);
	};

	buildJSONSchema();

	watcher.on("change", () => {
		buildJSONSchema();
	});
};

module.exports = watchJSONSchema;
