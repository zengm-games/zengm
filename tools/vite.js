const fs = require("fs");
const build = require("./lib/buildFuncs");
const generateJSONSchema = require("./lib/generateJSONSchema");
const getSport = require("./lib/getSport");

const sport = getSport();

console.log(`Building ${sport}...`);

build.reset();
build.copyFiles();
build.buildCSS(true);

const jsonSchema = generateJSONSchema(sport);
fs.mkdirSync("build/files", { recursive: true });
fs.writeFileSync(
	"build/files/league-schema.json",
	JSON.stringify(jsonSchema, null, 2),
);
