import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const FILENAME = "build/files/league-schema.json";

const makeFile = async () => {
	const { createJsonSchemaFile } =
		await import("./build/createJsonSchemaFile.ts");
	await createJsonSchemaFile("test");
};

if (!existsSync(FILENAME)) {
	console.log("[pre-test] No league-schema.json found, creating...");
	await makeFile();
} else {
	const text = await readFile(FILENAME, "utf8");
	try {
		JSON.parse(text);
	} catch {
		// Invalid JSON in file somehow
		console.log("[pre-test] Invalid league-schema.json found, replacing...");
		await makeFile();
	}
}
