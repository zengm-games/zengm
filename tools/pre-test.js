import fs from "node:fs";
import generateJSONSchema from "./lib/generateJSONSchema.js";

if (!fs.existsSync("build/files/league-schema.json")) {
	const jsonSchema = generateJSONSchema("test");
	fs.mkdirSync("build/files", { recursive: true });
	fs.writeFileSync(
		"build/files/league-schema.json",
		JSON.stringify(jsonSchema, null, 2),
	);
}
