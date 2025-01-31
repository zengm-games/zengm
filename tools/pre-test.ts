import fs from "node:fs";

if (!fs.existsSync("build/files/league-schema.json")) {
	const { generateJsonSchema } = await import("./lib/generateJsonSchema.ts");
	const jsonSchema = generateJsonSchema("test");
	fs.mkdirSync("build/files", { recursive: true });
	fs.writeFileSync(
		"build/files/league-schema.json",
		JSON.stringify(jsonSchema, null, 2),
	);
}
