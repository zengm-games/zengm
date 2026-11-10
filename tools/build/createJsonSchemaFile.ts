import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import { generateJsonSchema } from "./generateJsonSchema.ts";

export const JSON_SCHEMA_FILENAME = "build/files/league-schema.json";

// Write to a temp file and then rename it, so a concurrent reader never sees a partially written file. This happens when lint runs lint-js and lint-ts in parallel and both write the file because it's missing.
export const writeJsonSchemaFile = async (
	jsonSchema: unknown,
	signal?: AbortSignal,
) => {
	await fs.mkdir("build/files", { recursive: true });
	const tempFilename = `${JSON_SCHEMA_FILENAME}.${randomUUID()}.tmp`;
	try {
		await fs.writeFile(tempFilename, JSON.stringify(jsonSchema, null, 2), {
			signal,
		});
		await fs.rename(tempFilename, JSON_SCHEMA_FILENAME);
	} catch (error) {
		await fs.rm(tempFilename, { force: true });
		throw error;
	}
};

export const createJsonSchemaFile = async (
	sport: Parameters<typeof generateJsonSchema>[0],
) => {
	await writeJsonSchemaFile(generateJsonSchema(sport));
};
