import fs from "node:fs";

if (!fs.existsSync("build/files/league-schema.json")) {
	const { createJsonSchemaFile } = await import(
		"./build/createJsonSchemaFile.ts"
	);
	await createJsonSchemaFile("test");
}
