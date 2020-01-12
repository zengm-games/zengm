const fs = require("fs");
const generateJSONSchema = require("./lib/generateJSONSchema");

const jsonSchema = generateJSONSchema("test");
fs.mkdirSync("build/files", { recursive: true });
fs.writeFileSync(
	"build/files/league-schema.json",
	JSON.stringify(jsonSchema, null, 2),
);
