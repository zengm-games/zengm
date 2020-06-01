const chokidar = require("chokidar");
const fs = require("fs");
const getSport = require("./getSport");

const watchJSONSchema = (updateStart, updateEnd, updateError) => {
	fs.mkdirSync("build/files", { recursive: true });

	const sport = getSport();

	const watcher = chokidar.watch("tools/lib/generateJSONSchema.js", {});

	const outFilename = "build/files/league-schema.json";

	const buildJSONSchema = () => {
		try {
			// Dynamically reload generateJSONSchema, cause that's what we're watching!
			delete require.cache[require.resolve("./generateJSONSchema")];
			const generateJSONSchema = require("./generateJSONSchema");

			const jsonSchema = generateJSONSchema(sport);
			const output = JSON.stringify(jsonSchema, null, 2);
			fs.writeFileSync(outFilename, output);

			updateEnd(outFilename);
		} catch (error) {
			updateError(outFilename, error);
		}
	};

	updateStart(outFilename);
	buildJSONSchema();

	watcher.on("change", () => {
		updateStart(outFilename);
		// Without setTimeout, sometimes the require() would result in no function
		setTimeout(() => {
			buildJSONSchema();
		}, 10);
	});
};

module.exports = watchJSONSchema;
