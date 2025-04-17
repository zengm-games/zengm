import { existsSync } from "node:fs";

if (!existsSync("build/files/league-schema.json")) {
	const { createJsonSchemaFile } = await import(
		"./build/createJsonSchemaFile.ts"
	);
	await createJsonSchemaFile("test");
}
