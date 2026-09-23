import { readFile } from "node:fs/promises";

const FILENAME = "build/files/league-schema.json";

const makeFile = async () => {
	const { createJsonSchemaFile } =
		await import("./build/createJsonSchemaFile.ts");
	await createJsonSchemaFile("test");
};

try {
	const text = await readFile(FILENAME, "utf8");
	try {
		JSON.parse(text);

		// Valid JSON, nothing else to do
	} catch {
		// Invalid JSON in file somehow
		console.log("[pre-test] Invalid league-schema.json found, replacing...");
		await makeFile();
	}
} catch (error) {
	if (error.code === "ENOENT") {
		console.log("[pre-test] No league-schema.json found, creating...");
		await makeFile();
	} else {
		throw error;
	}
}
