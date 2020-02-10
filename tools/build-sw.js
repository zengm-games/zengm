const fs = require("fs");
const replace = require("replace");
const build = require("./lib/buildFuncs");

console.log("Generating sw.js...");

const getRev = () => {
	const files = fs.readdirSync("build/gen");
	for (const file of files) {
		if (file.endsWith(".js")) {
			console.log(file);
			const rev = file.split("-")[1].replace(".js", "");
			return rev;
		}
	}

	throw new Error("rev not found");
};

(async () => {
	try {
		await build.buildSW();

		build.minifyJS("sw.js");

		const rev = getRev();
		replace({
			regex: "REV_GOES_HERE",
			replacement: rev,
			paths: ["build/sw.js"],
			silent: true,
		});
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
})();
