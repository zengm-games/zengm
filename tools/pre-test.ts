import fs from "node:fs";

if (!fs.existsSync("build/files/league-schema.json")) {
	const generateJSONSchema = (await import("./lib/generateJSONSchema.ts"))
		.default;
	const jsonSchema = generateJSONSchema("test");
	fs.mkdirSync("build/files", { recursive: true });
	fs.writeFileSync(
		"build/files/league-schema.json",
		JSON.stringify(jsonSchema, null, 2),
	);
}
